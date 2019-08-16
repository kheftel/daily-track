// REQUIRES /////////////////////////////
const express = require('express');
const moment = require('moment');
// const bodyParser = require('body-parser');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const User = require('../models/user');
const createError = require('http-errors');
const common = require('../common');
const log = common.log.extend('api');

const {
    body,
    check,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody,
    Sanitizers
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
    return respond(res, true, {
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

        if (!errors.isEmpty()) {
            var arr = errors.array();
            log('registration validation errors: %j', arr);

            return respond(res, false, {
                errors: arr
            });
        }

        // Create user with validated / sanitized data
        log('registering user %s', req.body.username);
        User.register(new User({
            username: req.body.username
        }), req.body.password, function (err) {
            if (err) {
                common.logError(err, 'Error registering user');
                return respond(res, false, {
                    error: err
                });
            }

            return respond(res, true, {
                message: 'User registered!'
            });
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

        if (!errors.isEmpty()) {
            var arr = errors.array();
            log('validation errors: %j', arr);

            return respond(res, false, {
                errors: arr
            });
        }

        // Create dataset with validated / sanitized data
        log('creating dataset %s', req.body.name);
        var dataset = new Dataset();
        dataset.name = req.body.name;
        dataset.yAxisLabel = req.body.yAxisLabel;
        dataset.owner = req.body.owner; // hidden field
        dataset.chartType = 'line'; // req.body.chartType;
        dataset.precision = 'daily';
        dataset.xAxisLabel = 'Date';

        // save the dataset and check for errors
        dataset.save(function (err) {
            if (err) {
                common.logError(err, 'Error saving dataset');
                return response(res, false, {
                    error: err
                });
            }

            return respond(res, false, {
                message: 'Dataset ' + dataset.name + ' created!'
            });
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
                if (err) {
                    common.logError(err, 'Error getting datasets');
                    return respond(res, false, {
                        error: err
                    });
                }

                return respond(res, true, {
                    data: datasets
                });
            });
    });

// get dataset (includes datapoints)
apiRouter.get('/sets/:id',

    // authenticate
    authorize,

    function (req, res, next) {
        // grab the dataset from the db
        Dataset.findById(req.params.id, function (err, dataset) {
            if (err) {
                common.logError(err, 'Database error finding dataset %s', req.params.id);
                return respond(res, false, {
                    error: err
                });
            }

            // bad id? no dataset found?
            if (!dataset) {
                log("No dataset found for id %s", req.params.id);
                return respond(res, false, {
                    message: "No dataset found for id " + req.params.id
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
                    if (err) {
                        common.logError(err, 'Database error finding points');
                        return respond(res, false, {
                            error: err
                        });
                    }

                    var result = dataset.toObject();

                    // truncate to time only
                    for (let i = 0; i < datapoints.length; i++) {
                        var point = datapoints[i].toObject();
                        point.x = truncateTime(point.x); //moment(point.x).utc().format('YYYY-MM-DD');
                        datapoints[i] = point;
                    }

                    result.data = datapoints;

                    return respond(res, true, {
                        data: result
                    });
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
        if (!errors.isEmpty()) {
            var arr = errors.array();
            log('validation errors: %j', arr);
            return respond(res, false, {
                errors: arr
            });
        }

        Dataset.findById(req.params.id, function (err, dataset) {
            if (err) {
                common.logError(err, 'Database error while finding dataset %s', req.params.id);
                return respond(res, false, {
                    error: err
                });
            }

            if (dataset) {
                // does the current user own this dataset?
                if (!dataset.owner.equals(req.user._id)) {
                    log('permission denied, %s does not own dataset %s', req.user._id, dataset.owner);
                    return respond(res, false, {
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
                            if (err) {
                                common.logError('Error while finding datapoints for dataset %s', req.params.id);
                                return respond(res, false, {
                                    error: err
                                });
                            }

                            if (datapoint) {
                                // cannot delete
                                return respond(res, false, {
                                    errors: [{
                                        msg: 'Cannot delete non-empty dataset. Please delete all points first.'
                                    }]
                                });
                            } else {
                                //empty, can delete
                                dataset.delete((err) => {
                                    if (err) {
                                        common.logError('Database error while deleting dataset %s', req.params.id);
                                        return respond(res, false, {
                                            error: err
                                        });
                                    }

                                    return respond(res, true, {
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
                        if (err) {
                            common.logError(err, 'Error while saving dataset %s', dataset._id);
                            return respond(res, false, {
                                error: err
                            });
                        }

                        return respond(res, true, {
                            message: 'Dataset ' + dataset.name + ' updated!'
                        });
                    });
                }
            } else {
                // dataset not found
                return respond(res, false, {
                    errors: [{
                        msg: "No dataset found"
                    }]
                });
            }
        });
    }
]);

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
            common.logError(e, 'Invalid date format (should be YYYY-MM-DD)');
            throw new Error('Invalid date format (should be YYYY-MM-DD)');
        }
        req.body.x = result;
        return true;
    }),
    // validate / sanitize value
    body('y', 'Value should be a number, yo.').isNumeric().toInt(),
    body('tags')
    .custom((value, {
        req,
        location,
        path
    }) => {
        // TO DO: validate / escape / sanitize here
        // if(Array.isArray(value)) {
        //     for(let i in value) {
        //         value[i] = escape(value[i]);
        //     }
        // }
        return true;
    }),
    // Process request after validation and sanitization.
    (req, res, next) => {

        // send the validation errors, if any
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            var arr = errors.array();
            log('validation errors: %j', arr);

            respond(res, false, {
                errors: arr
            });
        }

        // Create/update/delete datapoint with validated / sanitized data
        Datapoint.findOne({
                dataset: req.params.id,
                x: req.body.x
            })
            .exec((err, datapoint) => {
                if (err) {
                    common.logError(err, 'error while finding datapoint %s in dataset %s', req.body.x, req.params.id);
                    return respond(res, false, {
                        error: err
                    });
                }

                if (datapoint) {
                    if (req.body.delete == "1") {
                        // delete datapoint
                        var deletedPoint = datapoint.toObject();
                        deletedPoint.x = truncateTime(deletedPoint.x);
                        datapoint.delete((err) => {
                            if (err) {
                                common.logError(err, 'error while deleting datapoint');
                                return respond(res, false, {
                                    error: err
                                });
                            }

                            return respond(res, true, {
                                message: 'Datapoint deleted',
                                datapoint: deletedPoint
                            });
                        });
                    } else {
                        // update datapoint
                        datapoint.y = req.body.y;
                        datapoint.tags = req.body.tags;
                        datapoint.save((err) => {
                            if (err) {
                                common.logError(err, 'Error while updating datapoint');
                                return respond(res, false, {
                                    error: err
                                });
                            }

                            var point = datapoint.toObject();
                            point.x = truncateTime(point.x);
                            return respond(res, true, {
                                message: 'Datapoint updated',
                                datapoint: point
                            });
                        });
                    }
                } else {
                    // delete error
                    if (req.body.delete == "1") {
                        return respond(res, false, {
                            errors: [{
                                msg: "No datapoint to delete"
                            }]
                        });
                    }

                    // create new datapoint
                    var newpoint = new Datapoint();
                    newpoint.x = req.body.x;
                    newpoint.y = req.body.y;
                    newpoint.tags = req.body.tags;
                    newpoint.dataset = req.params.id;

                    // save the datapoint and check for errors
                    newpoint.save(function (err) {
                        if (err) {
                            common.logError(err, 'Error while saving datapoint');
                            return respond(res, false, {
                                error: err
                            });
                        }

                        var point = newpoint.toObject();
                        point.x = truncateTime(point.x);
                        return respond(res, true, {
                            message: 'Datapoint created for ' + req.body.x,
                            datapoint: point
                        });
                    });
                }
            });
    }
]);

// get a range of datapoints for a dataset
// apiRouter.get('/sets/:id/range/:start/:end', function (req, res) {
//     Datapoint.find({
//             'dataset': req.params.id,
//         })
//         .where('x').gte(req.params.start).lte(req.params.end)
//         .sort({
//             x: 'asc'
//         })
//         .exec(function (err, datapoints) {
//             if (err) {
//                 common.logError(err, 'Error while getting range of datapoints');
//                 return respond(res, false, {
//                     error: err
//                 });
//             }
//             return res.json(datapoints);
//         });
// });

// // get a single datapoint - kinda redundant
// apiRouter.get('/points/:id',

//     // authenticate
//     authorize,

//     function (req, res) {
//         // grab the dataset from the db
//         Datapoint.findById(req.params.id, function (err, datapoint) {
//             if (err) {
//                 common.logError(err, 'Error while getting datapoint');
//                 return respond(res, false, {
//                     error: err
//                 });
//             }

//             return res.json(datapoint);
//         });
//     });

// // PUT = update the datapoint
// apiRouter.put('/points/:id',

//     // authenticate
//     authorize,

//     function (req, res) {

//         Datapoint.findById(req.params.id, function (err, datapoint) {
//             if (err)
//                 return res.send(err);

//             // update the datapoint's info - for now, only y supported
//             // TO DO: update datapoint's x value, but test for dups
//             ['y'].forEach(function (element) {
//                 if (req.body[element] !== undefined)
//                     datapoint[element] = req.body[element];
//             });

//             // save the datapoint
//             datapoint.save(function (err) {
//                 if (err)
//                     return res.send(err);

//                 return res.json({
//                     message: 'Datapoint updated!'
//                 });
//             });
//         });
//     });

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
        return respond(res, false, {
            message: 'Unauthorized'
        });
    }
    next();
}

function handleError(err, req, res, next) {
    common.logError(err, 'API Error Handler');
    var statusCode = err.status || 500;
    return res.status(statusCode).json({
        success: false,
        message: err.message,
        text: err.toString()
    });
}

function respond(res, success, data) {
    var response = {
        success: success,
        ...data
    };
    return res.json(response);
}

// helper function to truncate time values from date objects
function truncateTime(x) {
    return moment(x).utc().format('YYYY-MM-DD');
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