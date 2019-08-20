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

    this._models = {};
    for (let k in options.models) {
        this._models[k] = options.models[k];
    }

    this._authModel = options.authModel || 'User';

    this.passport = options.passport;
}

BackendMongoose.prototype.getModel = function (model) {
    return this._models[model];
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

BackendMongoose.prototype.initAuthentication = function () {
    // Configure passport-local to use desired model for authentication
    let model = this._models[this._authModel];
    this.passport.use(new LocalStrategy(model.authenticate()));
    this.passport.serializeUser(model.serializeUser());
    this.passport.deserializeUser(model.deserializeUser());
};

BackendMongoose.prototype.registerUser = function (options, cb) {
    let authModel = this.getModel(this._authModel);

    authModel.register(new authModel({
        username: options.username
    }), options.password, cb);
};

BackendMongoose.prototype.authenticate = function (options) {
    return this.passport.authenticate('local', {
        ...options
    });
};

BackendMongoose.prototype.create = function (model, options, cb) {
    let Model = this.getModel(model);
    let result = new Model();
    for (let k in options) {
        result[k] = options[k];
    }
    result.save(cb);
    return result;
};

module.exports = BackendMongoose;