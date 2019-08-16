const assert = require('assert');
const should = require('should');
const common = require('../server/common');
const VError = require('verror');

describe('common module', function() { 
    it('default log exists', function() {
        should.exist(common.log);
    });
    it('error log exists', function() {
        should.exist(common.error);
    });
    it('verror() creates verror object correctly', function () {
        let ve = common.verror('error message');
        assert(ve instanceof VError);
        ve.message.should.equal('error message');
    });
});