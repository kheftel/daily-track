const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
debug.enable('dailytrackr*');

const logger = require('../server/logger');
const siteRouter = require('../server/routes/site');
const apiRouter = require('../server/routes/api');

describe('common module', function () {
    var logs = [];
    function stubLog(log, name) {
        logs[name] = [];
        log._oldLogFunction = log.log;
        log.log = function (msg) {
            logs[name].push(msg);
        };
    }
    function unStubLog(log) {
        log.log = log._oldLogFunction;
        delete log._oldLogFunction;
    }
    function getStubbedMessages(name) {
        return logs[name];
    }

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

describe('site router', function () {
    it('should be non-null', function () {
        assert(siteRouter != null);
    });
});

describe('api router', function () {
    it('should be non-null', function () {
        assert(apiRouter != null);
    });
});