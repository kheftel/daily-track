// REQUIRES /////////////////////////////
const express = require('express'),
    path = require('path'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    apiRouter = require('./routes/api'),
    config = require('./config.json');

var port = process.env.PORT || 8080;

// DATABASE ////////////////////////
var mongoDB = config.db.dev;
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

// ROUTES //////////////////////
// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// add index route
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

// register /api routes
app.use('/api', apiRouter);


// START SERVER ////////////////////////////
app.set('port', port);

app.listen(port, () => {
    console.log('Dailytrack listening on port ' + port);
});
