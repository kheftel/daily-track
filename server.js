// REQUIRES /////////////////////////////
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const moment = require('moment');
const apiRouter = require('./routes/apirouter');
const defaultRouter = require('./routes/defaultrouter');
const createError = require('http-errors');
const logger = require('morgan');
var webpackAssets = require('express-webpack-assets');

var port = process.env.PORT || 8080;

// APP /////////////
var app = express();
app.use(logger('dev'));
if (app.get('env') === 'development') {
    app.locals.pretty = true;
}

// VIEWS //////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// other stuff
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({keys: ['secretkey1', 'secretkey2', '...']}));

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

// DATABASE ////////////////////////
var mongoDB = process.env.MONGODB_URI;
if (!mongoDB) {
    var config = require('./config.json');
    mongoDB = config.db.dev;
}
mongoose.connect(mongoDB, {
    useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// ROUTES //////////////////////

// register /api routes
app.use('/api', apiRouter);

// add default router
app.use('/', defaultRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.locals.siteTitle = 'DailyTrack - Error';
    res.locals.pageTitle = 'Error';

    var active = {
        noscroll: true
    };

    res.locals.active = active;
    res.locals.nav = [];

    // render the error page
    err.status = err.status || 500;
    res.status(err.status || 500);
    res.render('error');
});

// START SERVER ////////////////////////////
app.set('port', port);

app.listen(port, () => {
    console.log('Dailytrack listening on port ' + port);
});