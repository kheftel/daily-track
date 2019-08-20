const logger = require('./logger');
const log = logger.log.extend('BackendService');
const cookieSession = require('cookie-session');

function BackendService({
    backend
}) {
    this.backend = backend;
    this.connection = backend.connection;
    this.connection.on('error', (err) => {
        logger.logError(err, 'backend error');
    });

    // schemas
    this.User = backend.User;
    this.Dataset = backend.Dataset;
    this.Datapoint = backend.Datapoint;
}

BackendService.prototype.getModel = function (model) {
    return this.backend.getModel(model);
};

BackendService.prototype.connect = function (url) {
    return this.backend.connect(url)
        .then(() => {
            log('connected to backend');
        });
};

BackendService.prototype.createSession = function (options) {
    options = options || {};
    var type = options.type ? options.type : 'backend';
    var secret = options.secret;
    var saveUninitialized = options.saveUninitialized;
    var resave = options.resave;
    var maxAge = options.maxAge ? options.maxAge : 60 * 60 * 24 * 1000;

    switch (type) {
        case 'backend':
            return this.backend.createSession({
                secret: secret,
                saveUninitialized: saveUninitialized,
                resave: resave,
            });
        case 'cookie':
            return cookieSession({
                secret: secret,
                maxAge: maxAge,
            });
    }
};

BackendService.prototype.initAuthentication = function (options) {
    return this.backend.initAuthentication(options);
};

BackendService.prototype.registerUser = function(options, cb) {
    return this.backend.registerUser(options, cb);
};

module.exports = BackendService;