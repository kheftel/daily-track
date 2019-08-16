const assert = require('assert');
const should = require('should');
const common = require('../server/common');

describe('common module', function() { 
    it('log exists', function() {
        should.exist(common.log);
    });
});