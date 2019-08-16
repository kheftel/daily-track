// load .env in non-production environments
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// REQUIRES /////////////////////////////
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const moment = require('moment');
const apiRouter = require('./routes/api');
const siteRouter = require('./routes/site');
const logger = require('morgan');
const webpackAssets = require('express-webpack-assets');
const flash = require('connect-flash');
const compression = require('compression');
const VError = require('verror');
const common = require('./server/common');
const log = common.log.extend('server');

// DATABASE ////////////////////////
var dburl = process.env.MONGODB_URI;
mongoose.connect(dburl, {
    useNewUrlParser: true
})
.then(() => {
    log('connected to mongoose');
});
var db = mongoose.connection;
mongoose.set('useCreateIndex', true);
db.on('error', (err) => {
    common.logError(err, 'mongoose error');
});

// APP /////////////
var app = express();
// logging
app.use(logger('combined'));
if (app.get('env') === 'development') {
    app.locals.pretty = true;
}
// gzip responses in production
if(process.env.NODE_ENV === 'production') {
    app.use(compression());
}

// VIEWS //////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// other stuff
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}));
app.use(flash());

// allow app to find list of webpack-ified assets
app.use(webpackAssets('./webpack-assets.json', {
    devMode: true
}));

// serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure passport-local to use account model for authentication
const User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ROUTES //////////////////////

// register /api routes
app.use('/api', apiRouter);

// add site router
app.use('/', siteRouter);

// START SERVER ////////////////////////////
var port = process.env.PORT || 8080;
app.set('port', port);
app.listen(port, () => {
    log('DailyTrackr listening on port ' + port);
});