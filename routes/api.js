// REQUIRES /////////////////////////////
const express = require('express');
const moment = require('moment');
// const bodyParser = require('body-parser');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const User = require('../models/user');
const createError = require('http-errors');

const {
    body,
    check,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

require('moment-round');

// API /////////////////////////////
var apiRouter = express.Router();

// use bodyparser on apiRouter to get POST vars - app now uses bodyparser
// apiRouter.use(bodyParser.urlencoded({
//     extended: true
// }));
// apiRouter.use(bodyParser.json());

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
apiRouter.get('/', authorize, function (req, res) {
    return res.json({
        message: 'hooray! welcome to our api!'
    });
});

// register user - the only unprotected endpoint. maybe ensure logged out?
apiRouter.post('/register', [
    // validate / sanitize username
    body('username', 'Userame is required.').not().isEmpty().trim().escape(),

    // validate / sanitize password
    body('password', 'Password is required.').not().isEmpty().trim().escape(),

    (req, res, next) => {
        // handle validation errors
        const errors = validationResult(req);

        var data = {};

        if (!errors.isEmpty()) {
            console.log('validation errors:');
            var arr = errors.array();
            console.log(arr);

            data.success = false;
            data.errors = arr;

            return res.json(data);
        }

        // Create user with validated / sanitized data
        console.log('registering user');
        User.register(new User({
            username: req.body.username
        }), req.body.password, function (err) {
            if (err) {
                data.success = false;
                data.error = err;
                return res.json(data);
            }

            data.success = true;
            data.message = 'User registered!';
            return res.json(data);
        });
    }
]);

// create a dataset
apiRouter.post('/sets', [
    // authenticate
    authorize,

    // validate / sanitize name
    body('name', 'Name is required.').not().isEmpty().trim().escape(),

    // validate / sanitize unit
    body('yAxisLabel', 'Unit is required.').not().isEmpty().trim().escape(),

    // validate / sanitize owner
    body('owner', 'Owner is required.').not().isEmpty().trim().escape(),

    // sanitize chartType
    sanitizeBody('chartType').escape(),

    (req, res, next) => {
        // handle validation errors
        const errors = validationResult(req);

        var data = {};

        if (!errors.isEmpty()) {
            console.log('validation errors:');
            var arr = errors.array();
            console.log(arr);

            data.success = false;
            data.errors = arr;

            return res.json(data);
        }

        // Create dataset with validated / sanitized data
        var dataset = new Dataset();
        dataset.name = req.body.name;
        dataset.yAxisLabel = req.body.yAxisLabel;
        dataset.owner = req.body.owner; // hidden field
        dataset.chartType = 'line'; // req.body.chartType;
        dataset.precision = 'daily';
        dataset.xAxisLabel = 'Date';

        // save the dataset and check for errors
        dataset.save(function (err) {
            if (err)
                return res.send(err);

            data.success = true;
            data.message = 'Dataset ' + dataset.name + ' created!';
            return res.json(data);
        });
    }
]);

// get all the datasets
apiRouter.get('/sets',

    // authenticate
    authorize,

    function (req, res) {
        Dataset.find({
                owner: req.user._id
            })
            .sort({
                name: 'asc'
            })
            .exec(function (err, datasets) {
                if (err)
                    return res.send(err);

                return res.json(datasets);
            });
    });

// get dataset (includes datapoints)
apiRouter.get('/sets/:id',

    // authenticate
    authorize,

    function (req, res, next) {
        // grab the dataset from the db
        Dataset.findById(req.params.id, function (err, dataset) {
            if (err)
                return res.send(err);

            // bad id? no dataset found?
            if (!dataset) {
                return res.json({
                    success: false,
                    message: "no dataset found for id " + req.params.id
                });
            }

            // populate its datapoints
            Datapoint.find({
                    'dataset': req.params.id,
                })
                .sort({
                    x: 'asc'
                })
                .exec(function (err, datapoints) {
                    if (err)
                        return res.send(err);

                    var result = dataset.toObject();

                    // truncate to time only
                    for (let i = 0; i < datapoints.length; i++) {
                        var point = datapoints[i].toObject();
                        point.x = moment(point.x).utc().format('YYYY-MM-DD');
                        datapoints[i] = point;
                    }

                    result.data = datapoints;

                    return res.json(result);
                });
        });
    });

// update OR delete a dataset
apiRouter.post('/sets/:id', [

    // authenticate
    authorize,

    // validate / sanitize name
    body('name', 'Name is required.').not().isEmpty().trim().escape(),

    // validate / sanitize unit
    body('yAxisLabel', 'Unit is required.').not().isEmpty().trim().escape(),

    // sanitize chartType
    // sanitizeBody('chartType').escape(),

    function (req, res, next) {
        // handle validation errors
        const errors = validationResult(req);
        var data = {};
        if (!errors.isEmpty()) {
            console.log('validation errors:');
            var arr = errors.array();
            console.log(arr);
            data.success = false;
            data.errors = arr;
            return res.json(data);
        }

        Dataset.findById(req.params.id, function (err, dataset) {
            if (err)
                return res.send(err);

            if (dataset) {
                // does the current user own this dataset?
                if (!dataset.owner.equals(req.user._id)) {
                    console.log(dataset.owner, req.user._id);
                    return res.json({
                        success: false,
                        errors: [{
                            msg: 'Permission denied, you do not own this dataset'
                        }]
                    });
                }

                if (req.body.delete == "1") {
                    // delete dataset, but only if it has no datapoints

                    Datapoint.findOne({
                            dataset: req.params.id
                        })
                        .exec((err, datapoint) => {
                            if (err)
                                return res.send(err);

                            if (datapoint) {
                                // cannot delete
                                return res.json({
                                    success: false,
                                    errors: [{
                                        msg: 'Cannot delete non-empty dataset. Please delete all points first.'
                                    }]
                                });
                            } else {
                                //empty, can delete
                                dataset.delete((err) => {
                                    if (err)
                                        return res.send(err);

                                    return res.json({
                                        success: 'true',
                                        message: 'Dataset deleted'
                                    });
                                });
                            }
                        });
                } else {
                    // update dataset
                    dataset.name = req.body.name;
                    dataset.yAxisLabel = req.body.yAxisLabel;
                    // dataset.chartType = req.body.chartType;

                    // ['name', 'chartType', 'yAxisLabel'].forEach(function (element) {
                    //     if (req.body[element] !== undefined)
                    //         dataset[element] = req.body[element];
                    // });

                    // save the dataset
                    dataset.save(function (err) {
                        if (err)
                            return res.send(err);

                        data.success = true;
                        data.message = 'Dataset ' + dataset.name + ' updated!';
                        return res.json(data);
                    });
                }
            } else {
                // dataset not found
                return res.json({
                    success: false,
                    errors: [{
                        msg: "No dataset found"
                    }]
                });
            }
        });
    }
]);

// delete a dataset
// TO DO: what to do about the points?
// apiRouter.delete('/sets/:id', function (req, res) {
//     Dataset.findByIdAndDelete(req.params.id, function (err, dataset) {
//         if (err)
//             res.send(err);

//         res.json({
//             message: 'Successfully deleted ' + (dataset ? dataset.name : '')
//         });
//     });
// });

// create OR update OR delete a datapoint
apiRouter.post('/sets/:id/data', [

    // authenticate
    authorize,

    // validate date
    body('x')
    .custom((value, {
        req,
        location,
        path
    }) => {
        // date should be submitted as a UTC string in YYYY-MM-DD format
        // enforce date only by truncating time portion, if any
        var result;
        try {
            result = moment(new Date(value).toISOString()).utc().format('YYYY-MM-DD');
        } catch (e) {
            console.log(e);
            throw new Error('Invalid date format (should be YYYY-MM-DD)');
        }
        console.log('date after validation: ' + result);
        req.body.x = result;
        return true;
    }),
    // validate / sanitize value
    body('y', 'Value should be a number, yo.').isNumeric().toInt(),
    // Process request after validation and sanitization.
    (req, res, next) => {

        // send the validation errors, if any
        const errors = validationResult(req);
        var data = {};

        if (!errors.isEmpty()) {
            console.log('validation errors:');
            var arr = errors.array();
            console.log(arr);

            data.success = false;
            data.errors = arr;

            return res.json(data);
        }

        // Create/update/delete datapoint with validated / sanitized data
        Datapoint.findOne({
                dataset: req.params.id,
                x: req.body.x
            })
            .exec((err, datapoint) => {
                if (err)
                    return res.send(err);

                if (datapoint) {
                    if (req.body.delete == "1") {
                        // delete datapoint
                        datapoint.delete((err) => {
                            if (err)
                                return res.send(err);

                            return res.json({
                                success: 'true',
                                message: 'Datapoint deleted'
                            });
                        });
                    } else {
                        // update datapoint
                        datapoint.y = req.body.y;
                        datapoint.save((err) => {
                            if (err)
                                return res.send(err);

                            return res.json({
                                success: 'true',
                                message: 'Datapoint updated'
                            });
                        });
                    }
                } else {
                    // delete error
                    if (req.body.delete == "1") {
                        return res.json({
                            success: false,
                            errors: [{
                                msg: "No datapoint to delete"
                            }]
                        });
                    }

                    // create new datapoint
                    var newpoint = new Datapoint();
                    newpoint.x = req.body.x;
                    newpoint.y = req.body.y;
                    newpoint.dataset = req.params.id;

                    // save the datapoint and check for errors
                    newpoint.save(function (err) {
                        if (err)
                            return res.send(err);
                        data.success = true;
                        data.message = 'Datapoint created for ' + req.body.x;
                        return res.json(data);
                    });
                }
            });
    }
]);

// get all the datapoints for this set (obsolete)
// apiRouter.get('/sets/:id/data', function (req, res) {
//     Datapoint.find({
//             'dataset': req.params.id,
//         })
//         .sort({
//             x: 'asc'
//         })
//         .exec(function (err, datapoints) {
//             if (err)
//                 return res.send(err);
//             return res.json(datapoints);
//         });
// });

// get a range of datapoints for a dataset
apiRouter.get('/sets/:id/range/:start/:end', function (req, res) {
    Datapoint.find({
            'dataset': req.params.id,
        })
        .where('x').gte(req.params.start).lte(req.params.end)
        .sort({
            x: 'asc'
        })
        .exec(function (err, datapoints) {
            if (err)
                return res.send(err);
            return res.json(datapoints);
        });
});

// get a single datapoint - kinda redundant
apiRouter.get('/points/:id',

    // authenticate
    authorize,

    function (req, res) {
        // grab the dataset from the db
        Datapoint.findById(req.params.id, function (err, datapoint) {
            if (err)
                return res.send(err);

            return res.json(datapoint);
        });
    });

// PUT = update the datapoint
apiRouter.put('/points/:id',

    // authenticate
    authorize,

    function (req, res) {

        Datapoint.findById(req.params.id, function (err, datapoint) {
            if (err)
                return res.send(err);

            // update the datapoint's info - for now, only y supported
            // TO DO: update datapoint's x value, but test for dups
            ['y'].forEach(function (element) {
                if (req.body[element] !== undefined)
                    datapoint[element] = req.body[element];
            });

            // save the datapoint
            datapoint.save(function (err) {
                if (err)
                    return res.send(err);

                return res.json({
                    message: 'Datapoint updated!'
                });
            });
        });
    });

// sample data
apiRouter.get('/sampledata', (request, response) => {
    response.json(generateSampleData());
});

// catch 404 and forward to error handler
apiRouter.use(function (req, res, next) {
    next(createError(404));
});

// error handler
apiRouter.use(handleError);

// helper functions /////////

/**
 * route handler to make sure user is authorized to access api
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function authorize(req, res, next) {
    // ensure they're logged in
    if (!req.isAuthenticated()) {
        var data = {
            success: false,
            message: 'Unauthorized'
        };
        return res.json(data);
    }
    next();
}

function handleError(err, req, res, next) {
    console.log('api errror handler');
    var data = {
        success: false,
        message: err.message,
        text: err.toString()
    };
    var statusCode = err.status || 500;
    return res.status(statusCode).json(data);
}

// generate some data
function generateSampleData(type = "line", label = "Meditation") {
    var tempData = {
        "type": type,
        "label": label,
        "data": generateTempData(),
        "fill": false,
        "borderColor": "rgb(75, 192, 192)",
        "lineTension": 0
    };
    return tempData;
}

function generateTempData(numDays = 30, missPercentage = 0.3, maxValue = 30) {
    var tempData = [];
    for (var days = -numDays + 1; days <= 0; days++) {
        tempData.push({
            x: relativeDateString(days),
            y: (Math.random() < missPercentage) ? 0 : Math.ceil(Math.random() * maxValue)
        });
    }
    return tempData;
}

function relativeDateString(daysFromNow) {
    return moment().add(daysFromNow, 'd').format('YYYY-MM-DD');
}

module.exports = apiRouter;