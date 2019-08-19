const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
const logger = require('../server/logger');
const createSiteRouter = require('../server/routes/site');
const createAPIRouter = require('../server/routes/api');
const BackendService = require('../server/BackendService');
const EventEmitter = require('events');
const request = require('supertest');
const {
    stubLog,
    unStubLog,
    getStubbedMessages,
    stubUserModel,
    stubDatasetModel,
    stubDatapointModel,
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
    var server;
    afterEach(function (done) {
        server.close(done);
    });

    it('responds unauthorized if not logged in', function (done) {
        server = stubServer({
            createRouter: createAPIRouter
        });
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
        server = stubServer({
            createRouter: createAPIRouter
        });
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
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('apiroottest')
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
            createRouter: createAPIRouter,
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
                assert(server.backend.User.users.length == 1);
                done();
            });
    });
    it('creates a dataset', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('createdataset'),
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
                assert(server.backend.Dataset.sets.length == 1);
                done();
            });
    });
    it('gets datasets', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdatasets')
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
    it('fails to find nonexistent dataset', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdatasets')
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
            createRouter: createAPIRouter,
            ...getTestData('getdataset')
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
    it('updates a dataset', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdataset'),
        });
        request(server)
            .post('/sets/1')
            .send({
                name: 'fred',
                yAxisLabel: 'hours'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(res.body.success);
                server.backend.Dataset.findById(1, function (err, result) {
                    if (err) done(err);
                    assert(result.name == 'fred');
                    done();
                });
            });
    });
    it('won\'t update a dataset owned by someone else', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdataset'),
        });
        request(server)
            .post('/sets/3')
            .send({
                name: 'fred',
                yAxisLabel: 'hours'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('won\'t update a dataset if data is missing', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdataset'),
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
    it('won\'t update a nonexistent dataset', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdataset'),
        });
        request(server)
            .post('/sets/999')
            .send({
                name: 'fred',
                yAxisLabel: 'hours'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
                done();
            });
    });
    it('won\'t delete a non-empty dataset', function (done) {
        server = stubServer({
            createRouter: createAPIRouter,
            ...getTestData('getdataset'),
        });
        request(server)
            .post('/sets/1')
            .send({
                delete: 1,
                name: 'asdf',
                yAxisLabel: 'asdf'
            })
            .expect(200)
            .end(function (err, res) {
                // console.dir(res.body);
                if (err) return done(err);
                assert(!res.body.success);
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