const assert = require('assert');
const should = require('should');
const VError = require('verror');
const debug = require('debug');
debug.enable('dailytrackr*');

const common = require('../server/common');
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
        should.exist(common.log);
    });
    it('default log outputs messages', function () {
        stubLog(common.log, 'default');
        common.log('test message');
        assert(getStubbedMessages('default').length == 1);
        unStubLog(common.log);
    });

    it('error log exists', function () {
        should.exist(common.error);
    });
    it('error log outputs messages', function () {
        stubLog(common.error, 'error');
        common.error('test message');
        assert(getStubbedMessages('error').length == 1);
        unStubLog(common.error);
    });

    it('verror() creates verror object correctly', function () {
        let ve = common.verror('error message');
        assert(ve instanceof VError);
        ve.message.should.equal('error message');
    });

    it('logError() exists', function () {
        should.exist(common.logError);
    });
    it('logError() outputs messages', function () {
        stubLog(common.error, 'error');
        common.logError('test message');
        assert(getStubbedMessages('error').length >= 1);
        unStubLog(common.error);
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