// // load .env in non-production environments
// process.env.NODE_ENV = process.env.NODE_ENV || 'development';
// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config();
// }

// REQUIRES /////////////////////////////
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const createAPIRouter = require('./routes/api');
const createSiteRouter = require('./routes/site');
const morgan = require('morgan');
const webpackAssets = require('express-webpack-assets');
const flash = require('connect-flash');
const compression = require('compression');
const VError = require('verror');
const logger = require('./logger');
const log = logger.log.extend('server');

function createApp({
    backendService,
    sessionOptions
}) {
    backendService.connect(process.env.MONGODB_URI)
        .then(() => {
            log('connected to backend service');
        });
    backendService.connection.on('error', (err) => {
        logger.logError(err, 'backend service error');
    });

    // APP /////////////
    var app = express();

    // logging
    app.use(morgan('combined'));

    // not sure what this is
    if (app.get('env') === 'development') {
        app.locals.pretty = true;
    }

    // gzip responses in production
    if (process.env.NODE_ENV === 'production') {
        app.use(compression());
    }

    // set up sessions
    app.use(backendService.createSession(sessionOptions));

    // VIEWS //////////
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    // other stuff
    app.use(bodyParser.json());
    app.use(flash());

    // allow app to find list of webpack-ified assets
    app.use(webpackAssets('./webpack-assets.json', {
        devMode: true
    }));

    // serve static files
    app.use(express.static(path.join(__dirname, '../dist')));

    // Configure passport authentication
    app.use(passport.initialize());
    app.use(passport.session());
    backendService.initAuthentication({
        passport
    });

    // ROUTES //////////////////////
    app.use('/api', createAPIRouter({
        backendService
    }));
    app.use('/', createSiteRouter({
        backendService
    }));

    return app;
}

module.exports.createApp = createApp;