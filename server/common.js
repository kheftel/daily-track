// common modules needed throughout the server

const debug = require('debug');
const debugDefault = debug('dailytrackr');
const debugError = debugDefault.extend('error');
const VError = require('verror');

function logError() {
    var curError = new VError(...arguments);
    debugError(curError.message);
    debugError(VError.fullStack(curError));
}

module.exports = {
    log: debugDefault,
    error: debugError,
    logError: logError,
};
