const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
const logger = require('../server/logger');
const createSiteRouter = require('../server/routes/site');
const createAPIRouter = require('../server/routes/api');
const BackendService = require('../server/BackendService');
const EventEmitter = require('events');

var logs = [];

function stubLog(log, name) {
    log.enabled = true;
    logs[name] = [];
    log._oldLogFunction = log.log;
    log.log = function (msg) {
        logs[name].push(msg);
    };
}

function unStubLog(log) {
    log.enabled = false;
    log.log = log._oldLogFunction;
    delete log._oldLogFunction;
}

function getStubbedMessages(name) {
    return logs[name];
}

describe('common module', function () {
    it('default log exists', function () {
        should.exist(logger.log);
    });
    it('default log outputs messages', function () {
        stubLog(logger.log, 'default');
        logger.log('test message');
        assert(getStubbedMessages('default').length == 1);
        unStubLog(logger.log);
    });

    it('error log exists', function () {
        should.exist(logger.error);
    });
    it('error log outputs messages', function () {
        stubLog(logger.error, 'error');
        logger.error('test message');
        assert(getStubbedMessages('error').length == 1);
        unStubLog(logger.error);
    });

    it('verror() creates verror object correctly', function () {
        let ve = logger.verror('error message');
        assert(ve instanceof VError);
        ve.message.should.equal('error message');
    });

    it('logError() exists', function () {
        should.exist(logger.logError);
    });
    it('logError() outputs messages', function () {
        stubLog(logger.error, 'error');
        logger.logError('test message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(logger.error);
    });
});

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
                    }, 100);
                }));
            }
        }
    });
    it('should be non-null', function () {
        assert(service != null);
    });
    it('should log an error', function () {
        stubLog(logger.error, 'error');
        emitter.emit('error', 'message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(logger.error);
    });
    it('should create a backend session', function () {
        assert(service.createSession({
            secret: 'keyboard cat'
        }) == 'keyboard cat');
        assert(service.createSession({
            type: 'backend',
            secret: 'keyboard cat'
        }) == 'keyboard cat');
        assert(service.createSession() == null);
    });
    it('should create a cookie session', function () {
        assert(service.createSession({
            type: 'cookie',
            secret: 'keyboard cat',
            maxAge: 1000 * 60 * 60
        }) != null);
    });
    it('should initialize authentication', function () {
        assert(service.initAuthentication({
            option: 'someoption'
        }) == 'success');
    });
    it('should connect to backend', function (done) {
        service.connect('http://example.com')
            .then(function() {
                done();
            });
    });
});

describe('site router', function () {
    it('should be non-null', function () {
        assert(createSiteRouter != null);
    });
});

describe('api router', function () {
    it('should be non-null', function () {
        assert(createAPIRouter != null);
    });
});