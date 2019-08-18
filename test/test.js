const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
const logger = require('../server/logger');
const createSiteRouter = require('../server/routes/site');
const createAPIRouter = require('../server/routes/api');
const BackendService = require('../server/BackendService');
const EventEmitter = require('events');
const express = require('express');
const request = require('supertest');

// helper functions ////////////////

// log helpers /////////////////////
var _logs = [];

function stubLog(log, name) {
    log.enabled = true;
    _logs[name] = [];
    log._oldLogFunction = log.log;
    log.log = function (msg) {
        _logs[name].push(msg);
    };
}

function unStubLog(log) {
    log.enabled = false;
    log.log = log._oldLogFunction;
    delete log._oldLogFunction;
}

function getStubbedMessages(name) {
    return _logs[name];
}

// User model helpers ///////////////
function stubUserModel(options) {
    options = options || {};

    function FakeUser(options) {
        this.username = options.username;
        this.password = options.password;
    }

    // convenience departure from spec
    FakeUser.users = options.users || [];

    FakeUser.register = function (user, password, cb) {
        user.password = password;
        
        // only supports 1!
        user._id = 1;
        
        FakeUser.users.push(user);
        if (cb) cb();
    };
    return FakeUser;
}

// Dataset model helpers
function stubDatasetModel(options) {
    options = options || {};

    function FakeDataset(options) {
        options = options || {};
    }

    FakeDataset.prototype.save = function (cb) {
        if(this._id == null) this._id = 1;
        
        // doesn't work on update!
        FakeDataset.sets.push(this);
        
        cb();
    };

    // convenience departure from spec
    FakeDataset.sets = options.sets || [];

    FakeDataset.find = function (filter) {
        this.filter = filter;
        return this;
    };
    FakeDataset.sort = function () {
        return this;
    };
    FakeDataset.exec = function (cb) {
        var result = [];
        for (var i = 0; i < FakeDataset.sets.length; i++) {
            var set = FakeDataset.sets[i];
            if (!this.filter) {
                result.push(set);
                continue;
            }
            if (this.filter.owner != null && set.owner == this.filter.owner) {
                result.push(set);
            }
        }
        this.filter = null;
        cb(null, result);
    };
    return FakeDataset;
}

// server helpers //////////
function stubServer(options) {
    options = options || {};
    var backend = {
        User: stubUserModel(options.userOptions),
        Dataset: stubDatasetModel(options.datasetOptions),
        Datapoint: {}
    };
    router = createAPIRouter({
        backend: backend
    });
    app = express();
    if (options.stubAuth) {
        app.use((req, res, next) => {
            req.user = options.user;
            req.isAuthenticated = function () {
                return req.user != null;
            };
            next();
        });
    }
    app.use(router);
    server = app.listen(3000, function () {});

    // convenience departure from spec
    server.backend = backend;

    return server;
}

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
    var emitter = new EventEmitter();
    var service = new BackendService({
        backend: {
            connection: emitter,
            createSession(options) {
                return options.secret;
            },
            initAuthentication(options) {
                return 'success';
            },
            connect(url) {
                return (new Promise((resolve, reject) => {
                    setTimeout(function () {
                        resolve();
                    }, 50);
                }));
            }
        }
    });
    it('exists', function () {
        assert(service != null);
    });
    it('catches errors from backend connection', function () {
        stubLog(logger.error, 'error');
        emitter.emit('error', 'message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(logger.error);
    });
    it('creates a backend session', function () {
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
        assert(service.createSession({
            type: 'cookie',
            secret: 'keyboard cat',
            maxAge: 1000 * 60 * 60
        }) != null);
    });
    it('initializes authentication', function () {
        assert(service.initAuthentication({
            option: 'someoption'
        }) == 'success');
    });
    it('connects to backend', function (done) {
        service.connect('http://example.com')
            .then(function () {
                done();
            });
    });
});

// ApiRouter //////////////////////////////////
describe('api router', function () {
    afterEach(function (done) {
        server.close(done);
    });

    it('responds unauthorized if not logged in', function (done) {
        var server = stubServer();
        request(server)
            .get('/')
            .expect(401, {
                success: false,
                message: 'Unauthorized'
            })
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });
    it('sends 404', function (done) {
        var server = stubServer();
        request(server)
            .get('/nonexistentpage')
            .set('Accept', 'application/json')
            .expect(404)
            .expect(function (res) {
                assert(!res.body.success);
            })
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });
    it('responds to /', function (done) {
        var server = stubServer({
            stubAuth: true,
            user: {
                username: 'test',
                password: 'password',
                _id: 1
            }
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
        var server = stubServer();
        request(server)
            .post('/register')
            .send({
                username: 'test',
                password: 'password'
            })
            .end(function (err, res) {
                if (err) return done(err);
                assert(server.backend.User.users.length == 1);
                done();
            });
    });
    it('creates a dataset', function (done) {
        var server = stubServer({
            stubAuth: true,
            userOptions: {
                users: [{
                    username: 'test',
                    password: 'password',
                    _id: 1
                }]
            },
            user: {
                username: 'test',
                password: 'password',
                _id: 1
            },
        });
        request(server)
            .post('/sets')
            .send({
                name: 'dataset 1',
                yAxisLabel: 'hours',
                owner: 1,
                chartType: 'line'
            })
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                assert(server.backend.Dataset.sets.length == 1);
                done();
            });
    });
    it('gets datasets', function (done) {
        var server = stubServer({
            stubAuth: true,
            userOptions: {
                users: [{
                    username: 'test',
                    password: 'password',
                    _id: 1
                }]
            },
            user: {
                username: 'test',
                password: 'password',
                _id: 1
            },
            datasetOptions: {
                sets: [{
                        _id: 1,
                        owner: 1,
                        name: 'dataset 1'
                    },
                    {
                        _id: 2,
                        owner: 1,
                        name: 'dataset 2'
                    },
                    {
                        _id: 3,
                        owner: 2,
                        name: 'dataset 3'
                    }
                ]
            },
        });
        request(server)
            .get('/sets')
            .end(function (err, res) {
                // console.dir(res.body);
                assert(res.body.success);
                assert(res.body.data.length == 2);
                if (err) return done(err);
                done();
            });
    });
});

// SiteRouter //////////////////
describe('site router', function () {
    it('should be non-null', function () {
        assert(createSiteRouter != null);
    });
});