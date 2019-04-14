// REQUIRES /////////////////////////////
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const moment = require('moment');
const apiRouter = require('./routes/api');
const indexRouter = require('./routes/index');
const createError = require('http-errors');
const logger = require('morgan');


var port = process.env.PORT || 8080;

// DATABASE ////////////////////////
var mongoDB = process.env.MONGODB_URI;
if (!mongoDB) {
    var config = require('./config.json');
    mongoDB = config.db.dev;
}
mongoose.connect(mongoDB, {
    useNewUrlParser: true
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
module.exports = db;

// more routes for our API will happen here

// const users = require('./users');

// APP /////////////
var app = express();
app.use(logger('dev'));
if (app.get('env') === 'development') {
    app.locals.pretty = true;
}

// VIEWS //////////
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// ROUTES //////////////////////
// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (request, response) => {
//     response.sendFile(__dirname + 'public/index.html');
// });

// register /api routes
app.use('/api', apiRouter);

// add index router
app.use('/', indexRouter);

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
    res.status(err.status || 500);
    res.render('error');
});

// START SERVER ////////////////////////////
app.set('port', port);

app.listen(port, () => {
    console.log('Dailytrack listening on port ' + port);
});