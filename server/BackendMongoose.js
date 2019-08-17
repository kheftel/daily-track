const mongoose = require('mongoose');
const logger = require('./logger');
const log = logger.log.extend('BackendMongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const Dataset = require('./models/dataset');
const Datapoint = require('./models/datapoint');

function BackendMongoose(options) {
    mongoose.set('useCreateIndex', true);
    this.connection = mongoose.connection;
    this.connection.on('error', (err) => {
        logger.logError(err, 'mongoose error');
    });

    // schemas
    this.User = User;
    this.Dataset = Dataset;
    this.Datapoint = Datapoint;
}

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
    passport
}) {
    // Configure passport-local to use account model for authentication
    passport.use(new LocalStrategy(this.User.authenticate()));
    passport.serializeUser(this.User.serializeUser());
    passport.deserializeUser(this.User.deserializeUser());
};

module.exports = BackendMongoose;