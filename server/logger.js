// logger used throughout the server

const debug = require('debug');
const debugDefault = debug('dailytrackr');
const debugError = debugDefault.extend('error');
const VError = require('verror');

function verror() {
    return new VError(...arguments);
}

function logError() {
    var curError = verror(...arguments);
    debugError(curError.message);
    debugError(VError.fullStack(curError));
}

module.exports = {
    log: debugDefault,
    error: debugError,
    verror: verror,
    logError: logError,
};
