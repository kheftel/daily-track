// load .env in non-production environments
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// requires
const BackendService = require('./BackendService');
const BackendMongoose = require('./BackendMongoose');
const logger = require('./logger');
const log = logger.log.extend('index');

// server
const {
    createApp
} = require('./server');
const app = createApp({
    backendService: new BackendService({
        backend: new BackendMongoose({
            models: {
                User: require('./models/User'),
                Dataset: require('./models/Dataset'),
                Datapoint: require('./models/Datapoint'),
            }
        })
    }),
    sessionOptions: {
        secret: process.env.SESSION_SECRET,
        saveUninitialized: true,
        resave: false,
    }
});

// START SERVER ////////////////////////////
var port = process.env.PORT || 8080;
app.set('port', port);
app.listen(port, () => {
    log('DailyTrackr listening on port ' + port);
});