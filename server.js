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
const apiRouter = require('./routes/api');
const siteRouter = require('./routes/site');
const logger = require('morgan');
const webpackAssets = require('express-webpack-assets');
const flash = require('connect-flash');

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

// add site router
app.use('/', siteRouter);

// START SERVER ////////////////////////////
app.set('port', port);

app.listen(port, () => {
    console.log('Dailytrack listening on port ' + port);
});