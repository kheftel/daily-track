const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
const logger = require('../server/logger');
const SiteController = require('../server/controllers/sitecontroller');
const SiteRouter = require('../server/routes/siterouter');
const ApiRouter = require('../server/routes/apirouter');
const BackendService = require('../server/BackendService');
const request = require('supertest');
const expect = require('chai').expect;
const {
    stubLog,
    unStubLog,
    getStubbedMessages,
    stubUserModel,
    stubDatasetModel,
    stubDatapointModel,
    stubBackend,
    stubBackendService,
    stubServer,
    getTestData,
} = require('./stubs');

// helper functions ////////////////

// tests ///////////////////////////

// logger module //////////////////////
describe('logger module', function () {
    it('creates default log', function () {
        should.exist(logger.log);
    });
    it('outputs messages to default log', function () {
        stubLog(logger.log, 'default');
        logger.log('test message');
        assert(getStubbedMessages('default').length == 1);
        unStubLog(logger.log);
    });

    it('creates error log', function () {
        should.exist(logger.error);
    });
    it('outputs messages to error log', function () {
        stubLog(logger.error, 'error');
        logger.error('test message');
        assert(getStubbedMessages('error').length == 1);
        unStubLog(logger.error);
    });

    it('creates verror object correctly', function () {
        let ve = logger.verror('error message');
        assert(ve instanceof VError);
        ve.message.should.equal('error message');
    });

    it('exposes logError() convenience function', function () {
        should.exist(logger.logError);
    });
    it('outputs messages through logError() ', function () {
        stubLog(logger.error, 'error');
        logger.logError('test message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(logger.error);
    });
});

// BackendService ///////////////////////////
describe('BackendService', function () {
    var service;
    it('catches errors from backend connection', function () {
        service = new BackendService({
            backend: stubBackend()
        });
        stubLog(logger.error, 'error');
        service.connection.emit('error', 'message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(logger.error);
    });
    it('creates a backend session', function () {
        service = new BackendService({
            backend: stubBackend()
        });
        assert(service.createSession({
            secret: 'keyboard cat'
        }) == 'keyboard cat');
        assert(service.createSession({
            type: 'backend',
            secret: 'keyboard cat'
        }) == 'keyboard cat');
        assert(service.createSession() == null);
    });
    it('creates a cookie session', function () {
        service = new BackendService({
            backend: stubBackend()
        });
        assert(service.createSession({
            type: 'cookie',
            secret: 'keyboard cat',
            maxAge: 1000 * 60 * 60
        }) != null);
    });
    it('initializes authentication', function () {
        service = new BackendService({
            backend: stubBackend()
        });
        assert(service.initAuthentication({
            option: 'someoption'
        }) == 'success');
    });
    it('registers user', function () {
        service = new BackendService({
            backend: stubBackend({
                models: {
                    User: stubUserModel(),
                }
            })
        });
        service.registerUser({
            username: 'test',
            password: 'password'
        });
        assert(service.getModel('User').users.length == 1);
    });
    it('creates model objects', function () {
        service = new BackendService({
            backend: stubBackend({
                models: {
                    Dataset: stubDatasetModel(),
                }
            })
        });
        service.create('Dataset', null, (err) => {
            assert(err == null);
        });
    });
    it('authenticates', function (done) {
        service = new BackendService({
            backend: stubBackend({
                authenticate: () => {
                    done();
                }
            })
        });
        service.authenticate({
            username: 'test',
            password: 'password'
        });
    });
    it('connects to backend', function (done) {
        service = new BackendService({
            backend: stubBackend()
        });
        service.connect('http://example.com')
            .then(function () {
                done();
            });
    });
});

function stubReqWithOptions(options) {
    options = options || {};
    return {
        user: options.user || getTestData('testuser'),
        flash: options.flash || (() => {}),
        logout: () => {},
        params: options.params || {},
        app: options.app || {},
        path: options.path || '/',
        isAuthenticated: options.isAuthenticated || (() => true),
    };
}

function stubReqEmpty() {
    return {
        flash: () => {},
        logout: () => {},
    };
}

function stubResEmpty() {
    return {
        locals: {
            active: {}
        },
    };
}

function stubResWithOptions(options) {
    options = options || {};
    return {
        locals: options.locals || {
            active: {}
        },
        status: options.status || (() => {}),
        render: options.render || (() => {}),
        redirect: options.redirect || (() => {}),
    };
}

// siteController ////////////////////////////
describe('siteController', function () {
    it('ACL: / redirects to login if not authenticated', function (done) {
        let controller = SiteController(stubBackendService());
        controller.initialize()(
            stubReqWithOptions({
                path: '/',
                isAuthenticated: () => false,
            }),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/login');
                    done();
                }
            }),
            () => {}
        );
    });
    it('ACL: deep link redirects to login if not authenticated', function (done) {
        let controller = SiteController(stubBackendService());
        controller.initialize()(
            stubReqWithOptions({
                path: '/set/new',
                isAuthenticated: () => false,
            }),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/login');
                    done();
                }
            }),
            () => {}
        );
    });
    it('ACL: /login redirects to / if authenticated', function (done) {
        let controller = SiteController(stubBackendService());
        controller.initialize()(
            stubReqWithOptions({
                path: '/login',
                isAuthenticated: () => true,
            }),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/');
                    done();
                }
            }),
            () => {}
        );
    });
    it('initializes rendering for static pages', function (done) {
        let controller = SiteController(stubBackendService());
        controller.initialize()(
            stubReqWithOptions({
                path: '/',
            }),
            stubResEmpty(),
            done
        );
    });
    it('initializes rendering for dynamic pages', function (done) {
        let controller = SiteController(stubBackendService());
        controller.initialize()(
            stubReqWithOptions({
                path: '/set/blah',
                flash: () => ({
                    info: 'some info message',
                    error: 'some error message',
                }),
            }),
            stubResEmpty(),
            done
        );
    });
    it('renders overview page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.overview()(
            stubReqWithOptions(),
            stubResWithOptions({
                render: function (template) { // not arrow func
                    assert(template == 'overview');
                    // this == stubbed res
                    var unit = 'hours';
                    assert(this.locals.groups[unit].length == 2);
                    done();
                }
            }),
            () => {});
    });
    it('reports database error rendering overview page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('dberror'),
        }));
        controller.overview()(
            stubReqWithOptions(),
            stubResEmpty(),
            (err) => {
                // console.dir(err);
                assert(err instanceof Error);
                done();
            });
    });
    it('renders register page', function (done) {
        let controller = SiteController(stubBackendService());
        controller.register()(
            stubReqEmpty(),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'register');
                    done();
                }
            }),
            () => {});
    });
    it('redirects to /login after register', function (done) {
        let controller = SiteController(stubBackendService());
        controller.registerSuccess()(
            stubReqEmpty(),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/login');
                    done();
                }
            }),
            () => {});
    });
    it('renders login page', function (done) {
        let controller = SiteController(stubBackendService());
        controller.login()(
            stubReqEmpty(),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'login');
                    done();
                }
            }),
            () => {});
    });
    it('redirects to / after login', function (done) {
        let controller = SiteController(stubBackendService());
        controller.loginSuccess()(
            stubReqWithOptions(),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/');
                    done();
                }
            }),
            () => {});
    });
    it('redirects to / after logout', function (done) {
        let controller = SiteController(stubBackendService());
        controller.logout()(
            stubReqEmpty(),
            stubResWithOptions({
                redirect: (dest) => {
                    assert(dest == '/');
                    done();
                }
            }),
            () => {});
    });
    it('renders new set page', function (done) {
        let controller = SiteController(stubBackendService());
        controller.newDataset()(
            stubReqEmpty(),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'set-form');
                    done();
                }
            }),
            () => {});
    });
    it('renders set detail page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.viewDataset()(
            stubReqWithOptions({
                params: {
                    id: 1
                }
            }),
            stubResWithOptions({
                locals: {
                    active: {
                        title: '${DATASET_NAME}'
                    }
                },
                render: (template) => {
                    assert(template == 'dataset');
                    done();
                }
            }),
            () => {});
    });
    it('reports error rendering nonexistent set detail page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.viewDataset()(
            stubReqWithOptions({
                params: {
                    id: 999
                }
            }),
            stubResEmpty(),
            (err) => {
                assert(err instanceof Error);
                done();
            });
    });
    it('reports database error rendering set detail page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('dberror'),
        }));
        controller.viewDataset()(
            stubReqWithOptions(),
            stubResEmpty(),
            (err) => {
                // console.dir(err);
                assert(err instanceof Error);
                done();
            });
    });
    it('renders edit dataset page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.editDataset()(
            stubReqWithOptions({
                params: {
                    id: 1
                }
            }),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'set-form');
                    done();
                }
            }),
            () => {});
    });
    it('reports error rendering nonexistent edit dataset page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.editDataset()(
            stubReqWithOptions({
                params: {
                    id: 999
                }
            }),
            stubResEmpty(),
            (err) => {
                assert(err instanceof Error);
                done();
            });
    });
    it('reports database error rendering edit dataset page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('dberror'),
        }));
        controller.editDataset()(
            stubReqWithOptions(),
            stubResEmpty(),
            (err) => {
                // console.dir(err);
                assert(err instanceof Error);
                done();
            });
    });
    it('renders multi list page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.multiList()(
            stubReqWithOptions(),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'multi');
                    done();
                }
            }),
            () => {});
    });
    it('reports database error rendering multi list page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('dberror'),
        }));
        controller.multiList()(
            stubReqWithOptions(),
            stubResEmpty(),
            (err) => {
                assert(err instanceof Error);
                done();
            });
    });
    it('renders multi detail page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.multiDetail()(
            stubReqWithOptions({
                params: {
                    id: 1,
                    label: 'hours'
                }
            }),
            stubResWithOptions({
                locals: {
                    active: {
                        title: '${DATASET_UNIT}'
                    }
                },
                render: (template) => {
                    assert(template == 'multi');
                    done();
                }
            }),
            () => {});
    });
    it('reports database error rendering multi detail page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('dberror'),
        }));
        controller.multiDetail()(
            stubReqWithOptions({
                params: {
                    id: 1,
                    label: 'hours'
                }
            }),
            stubResEmpty(),
            (err) => {
                assert(err instanceof Error);
                done();
            });
    });
    it('returns 404 error', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.create404()(
            stubReqWithOptions(),
            stubResWithOptions(),
            (err) => {
                assert(err instanceof Error);
                done();
            });
    });
    it('renders error page', function (done) {
        let controller = SiteController(stubBackendService({
            ...getTestData('testdatasets'),
        }));
        controller.handleError()(
            new Error('an error occurred'),
            stubReqWithOptions({
                app: {
                    get: () => {}
                }
            }),
            stubResWithOptions({
                render: (template) => {
                    assert(template == 'error');
                    done();
                }
            }),
            () => {});
    });
});

// ApiRouter //////////////////////////////////
describe('api router', function () {
    var server;
    afterEach(function (done) {
        server.close(done);
    });

    it('responds unauthorized if not logged in', function (done) {
        server = stubServer({
            createRouter: ApiRouter
        });
        request(server)
            .get('/')
            .expect(401, {
                success: false,
                message: 'Unauthorized'
            })
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                done();
            });
    });
    it('sends 404', function (done) {
        server = stubServer({
            createRouter: ApiRouter
        });
        request(server)
            .get('/nonexistentpage')
            .set('Accept', 'application/json')
            .expect(404)
            .expect(function (res) {
                assert(!res.body.success);
            })
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                done();
            });
    });
    it('responds to /', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin')
        });
        request(server)
            .get('/')
            .set('Accept', 'application/json')
            .expect(200)
            .expect(function (res) {
                assert(res.body.success);
            })
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });
    it('registers a user', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
        });
        request(server)
            .post('/register')
            .send({
                username: 'test',
                password: 'password'
            })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                // console.dir(res.body);
                assert(server.backendService.getModel('User').users.length == 1);
                done();
            });
    });
    it('fails to register a user if validation errors', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
        });
        request(server)
            .post('/register')
            .send({
                username: 'test',
            })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                assert(!res.body.success);
                assert(server.backendService.getModel('User').users.length == 0);
                done();
            });
    });
    it('reports db error on register user', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/register')
            .send({
                username: 'test',
                password: 'password',
            })
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                assert(server.backendService.getModel('User').users.length == 0);
                done();
            });
    });
    it('logs in', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('testusers'),
        });
        request(server)
            .post('/login')
            .send({
                username: 'test',
                password: 'password',
            })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                // console.dir(res.body);
                assert(res.body.success);
                done();
            });
    });
    it('fails to log in if password incorrect', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('testusers'),
        });
        request(server)
            .post('/login')
            .send({
                username: 'test',
                password: 'wrong',
            })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                // console.dir(res.body);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to log in if validation errors', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('testusers'),
        });
        request(server)
            .post('/login')
            .send({
                username: 'test',
            })
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                // console.dir(res.body);
                assert(!res.body.success);
                done();
            });
    });
    it('creates a dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
        });
        request(server)
            .post('/sets')
            .send({
                name: 'dataset 1',
                yAxisLabel: 'hours',
                owner: 1,
                chartType: 'line'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backendService.getModel('Dataset').sets.length == 1);
                done();
            });
    });
    it('fails to create a dataset if validation errors', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
        });
        request(server)
            .post('/sets')
            .send({
                name: 'dataset 1',
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                assert(server.backendService.getModel('Dataset').sets.length == 0);
                done();
            });
    });
    it('reports db error on create dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/sets')
            .send({
                name: 'dataset 1',
                yAxisLabel: 'hours',
                owner: 1,
                chartType: 'line'
            })
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                assert(server.backendService.getModel('User').users.length == 0);
                done();
            });
    });
    it('gets datasets', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
        });
        request(server)
            .get('/sets')
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(res.body.data.length == 2);
                done();
            });
    });
    it('reports db error on get datasets', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .get('/sets')
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to find nonexistent dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
        });
        request(server)
            .get('/sets/asdf')
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('gets a dataset with points', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .get('/sets/1')
            .expect(200)
            .end(function (err, res) {
                assert(res.body.success);
                assert(res.body.data.data.length == 3);
                if (err) return done(err);
                done();
            });
    });
    it('reports db error on get dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .get('/sets/1')
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('updates a dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1')
            .send({
                name: 'fred',
                yAxisLabel: 'hours',
                chartType: 'line'
            })
            // .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                server.backendService.getModel('Dataset').findById(1, function (err, result) {
                    if (err) done(err);
                    assert(result.name == 'fred');
                    done();
                });
            });
    });
    it('reports db error on update dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/sets/1')
            .send({
                name: 'fred',
                yAxisLabel: 'hours',
                chartType: 'line'
            })
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to update a dataset owned by someone else', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/3')
            .send({
                name: 'fred',
                yAxisLabel: 'hours',
                chartType: 'line'
            })
            // .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to update a dataset if data is missing', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1')
            .send({})
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to update a nonexistent dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/999')
            .send({
                name: 'fred',
                yAxisLabel: 'hours'
            })
            // .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('fails to delete a non-empty dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1')
            .send({
                delete: 1,
                name: 'asdf',
                yAxisLabel: 'asdf'
            })
            // .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('reports db error on delete non-empty dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/sets/1')
            .send({
                delete: 1,
                name: 'asdf',
                yAxisLabel: 'asdf',
                chartType: 'line'
            })
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('deletes an empty dataset', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/2')
            .send({
                delete: 1,
                name: 'asdf',
                yAxisLabel: 'asdf',
                chartType: 'line'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backendService.getModel('Dataset').sets.length == 2);
                done();
            });
    });

    it('creates a datapoint', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: '2019-02-01',
                y: 8,
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backendService.getModel('Datapoint').points.length == 1);
                assert(server.backendService.getModel('Datapoint').points[0].y == 8);
                done();
            });
    });
    it('updates a datapoint', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: '2019-01-01',
                y: 8,
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(server.backendService.Datapoint.points);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backendService.getModel('Datapoint').points.length == 3);
                assert(server.backendService.getModel('Datapoint').points[0].y == 8);
                done();
            });
    });
    it('fails to update datapoint if validation errors', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: 'fred',
                y: 1,
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('reports db error on update datapoint', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('dberror'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: '2019-01-01',
                y: 10
            })
            .expect(500)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('deletes a datapoint', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: '2019-01-01',
                y: 8,
                delete: 1
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backendService.getModel('Datapoint').points.length == 2);
                done();
            });
    });
    it('fails to delete a non-existent datapoint', function (done) {
        server = stubServer({
            createRouter: ApiRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });
        request(server)
            .post('/sets/1/data')
            .send({
                x: '2017-01-01',
                y: 8,
                delete: 1
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                assert(server.backendService.getModel('Datapoint').points.length == 3);
                done();
            });
    });
});

// SiteRouter //////////////////
describe('site router', function () {
    var server;
    afterEach(function (done) {
        server.close(done);
    });

    it('responds to path /', function (done) {
        server = stubServer({
            createRouter: SiteRouter,
            ...getTestData('loggedin'),
            ...getTestData('testdatasets'),
            ...getTestData('testdatapoints'),
        });

        request(server)
            .get('/')
            // .expect(200)
            .end(function (err, res) {
                // console.dir(res.text);
                if (err) return done(err);
                done();
            });
    });
});