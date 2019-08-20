const mongoose = require('mongoose');
const logger = require('./logger');
const log = logger.log.extend('BackendMongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const LocalStrategy = require('passport-local').Strategy;

function BackendMongoose(options) {
    options = options || {};
    mongoose.set('useCreateIndex', true);
    this.connection = mongoose.connection;
    this.connection.on('error', (err) => {
        logger.logError(err, 'mongoose error');
    });

    this.models = {};
    for(let k in options.models) {
        this.models[k] = options.models[k];
    }
}

BackendMongoose.prototype.getModel = function (model) {
    return this.models[model];
};

BackendMongoose.prototype.connect = function (url) {
    var result = mongoose.connect(url, {
            useNewUrlParser: true
        })
        .then(() => {
            log('connected to mongoose');
        });
    return result;
};

BackendMongoose.prototype.createSession = function (options) {
    return session({
        ...options,
        store: new MongoStore({
            mongooseConnection: this.connection
        })
    });
};

BackendMongoose.prototype.initAuthentication = function ({
    passport,
    model
}) {
    // Configure passport-local to use desired model for authentication
    let _model = this.models[model];
    passport.use(new LocalStrategy(_model.authenticate()));
    passport.serializeUser(_model.serializeUser());
    passport.deserializeUser(_model.deserializeUser());
};

module.exports = BackendMongoose;