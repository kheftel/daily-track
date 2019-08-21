// REQUIRES /////////////////////////////
const express = require('express');
const moment = require('moment');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const logger = require('../logger');
const log = logger.log.extend('api');
const createAPIController = require('../controllers/apicontroller');

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
function createAPIRouter({
    backendService
}) {
    var controller = createAPIController(backendService);

    var apiRouter = express.Router();

    //use bodyparser to get POST vars
    apiRouter.use(bodyParser.urlencoded({
        extended: true
    }));
    apiRouter.use(bodyParser.json());

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

            backendService.registerUser({
                username: req.body.username,
                password: req.body.password,
            }, function (err, result) {
                if (err) {
                    return next(logger.verror(err, 'Error registering user'));
                }

                return respond(res, true, {
                    message: 'User registered!'
                });
            });
        }
    ]);

    // log in
    apiRouter.post('/login', [
        // validate / sanitize username
        body('username', 'Userame is required.').not().isEmpty().trim().escape(),

        // validate / sanitize password
        body('password', 'Password is required.').not().isEmpty().trim().escape(),

        (req, res, next) => {
            // handle validation errors
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                var arr = errors.array();
                log('login validation errors: %j', arr);

                return respond(res, false, {
                    errors: arr
                });
            }

            next();
        },

        backendService.authenticate({
            failWithError: true,
            failureFlash: true
        }),

        function (req, res, next) {
            // handle success
            return respond(res, true, {
                message: "Login successful for " + req.user.username
            });
        },

        function (err, req, res, next) {
            // handle error

            // passport stores its error messages in flash in session
            var errorMessages = req.flash('error');

            // override passport's 401 unauthorized
            res.status(200);
            return respond(res, false, {
                message: errorMessages.join(), // not sure if comma is correct
                passporterror: err
            });
        },
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
            backendService.create('Dataset', {
                name: req.body.name,
                yAxisLabel: req.body.yAxisLabel,
                owner: req.body.owner, // hidden field
                chartType: 'line',
                precision: 'daily',
                xAxisLabel: 'Date',
            }, function (err) {
                if (err) {
                    return next(logger.verror(err, 'Error saving dataset'));
                }

                return respond(res, true, {
                    message: 'Dataset ' + req.body.name + ' created!'
                });
            });
        }
    ]);

    // get all the datasets
    apiRouter.get('/sets',

        // authenticate
        authorize,

        function (req, res, next) {
            controller.getDatasetsForUser(req.user._id, function (err, datasets) {
                if (err) {
                    return next(logger.verror(err, 'Error getting datasets'));
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
            controller.getDatasetWithPoints(req.params.id, function (err, result) {
                if (err) {
                    return next(logger.verror(err, 'Database error getting dataset %s', req.params.id));
                }

                if (!result) {
                    return respond(res, false, {
                        message: "No dataset found for id " + req.params.id
                    });
                }

                return respond(res, true, {
                    data: result
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

            if (req.body.delete != 1) {
                // update dataset
                controller.updateDatasetForUser(req.user._id, req.params.id, {
                    name: req.body.name,
                    yAxisLabel: req.body.yAxisLabel
                }, (err, response) => {
                    if (err) return next(logger.verror(err, 'Error updating dataset %s', req.params.id));

                    if (response && response.message) {
                        return respond(res, false, {
                            message: response.message
                        });
                    }

                    return respond(res, true, {
                        message: 'Dataset updated!'
                    });
                });
            } else {
                // delete dataset
                controller.deleteDatasetForUser(req.user._id, req.params.id, (err, response) => {
                    if (err) return next(logger.verror(err, 'Error deleting dataset'));

                    if (response && response.message) {
                        return respond(res, false, {
                            message: response.message
                        });
                    }

                    return respond(res, true, {
                        message: 'Dataset deleted'
                    });
                });
            }
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
            try {
                let date = new Date(value).toISOString();
                // console.dir(date);
                let result = moment(date).utc().format('YYYY-MM-DD');
                req.body.x = result;
                return true;
            } catch (e) {
                // console.dir(e);
                logger.logError(e, 'Invalid date format (should be YYYY-MM-DD)');
                throw new Error('Invalid date format (should be YYYY-MM-DD)');
            }
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

                return respond(res, false, {
                    errors: arr
                });
            }

            if (req.body.delete != 1) {
                // create/update datapoint
                controller.createOrUpdateDatapointForDataset(req.params.id, {
                    x: req.body.x,
                    y: req.body.y,
                    tags: req.body.tags,
                }, (err, response) => {
                    if (err) return next(logger.verror(err, 'Error updating point'));

                    return respond(res, true, {
                        message: 'Datapoint saved',
                        datapoint: response.datapoint
                    });
                });
            } else {
                // delete datapoint
                controller.deleteDatapoint(req.params.id, {
                    x: req.body.x,
                }, (err, response) => {
                    if (err) return next(logger.verror(err, 'Error deleting datapoint'));

                    if (response.success) {
                        // datapoint was deleted
                        return respond(res, true, {
                            message: 'Dataset deleted',
                            datapoint: response.datapoint,
                        });
                    } else {
                        if (response.message) {
                            return respond(res, false, {
                                message: response.message,
                            });
                        }
                    }
                });
            }

            // Create/update/delete datapoint with validated / sanitized data
            // Datapoint.findOne({
            //         dataset: req.params.id,
            //         x: req.body.x
            //     })
            //     .exec((err, datapoint) => {
            //         if (err) {
            //             return next(logger.verror(err, 'error while finding datapoint %s in dataset %s', req.body.x, req.params.id));
            //         }

            //         if (datapoint) {
            //             if (req.body.delete == "1") {
            //                 // delete datapoint
            //                 var deletedPoint = datapoint.toObject();
            //                 deletedPoint.x = truncateTime(deletedPoint.x);
            //                 datapoint.delete((err) => {
            //                     if (err) {
            //                         return next(logger.verror(err, 'error while deleting datapoint'));
            //                     }

            //                     return respond(res, true, {
            //                         message: 'Datapoint deleted',
            //                         datapoint: deletedPoint
            //                     });
            //                 });
            //             } else {
            //                 // update datapoint
            //                 datapoint.y = req.body.y;
            //                 datapoint.tags = req.body.tags;
            //                 datapoint.save((err) => {
            //                     if (err) {
            //                         return next(logger.verror(err, 'Error while updating datapoint'));
            //                     }

            //                     var point = datapoint.toObject();
            //                     point.x = truncateTime(point.x);
            //                     return respond(res, true, {
            //                         message: 'Datapoint updated',
            //                         datapoint: point
            //                     });
            //                 });
            //             }
            //         } else {
            //             // delete error
            //             if (req.body.delete == "1") {
            //                 return respond(res, false, {
            //                     errors: [{
            //                         msg: "No datapoint to delete"
            //                     }]
            //                 });
            //             }

            //             // create new datapoint
            //             var newpoint = new Datapoint();
            //             newpoint.x = req.body.x;
            //             newpoint.y = req.body.y;
            //             newpoint.tags = req.body.tags;
            //             newpoint.dataset = req.params.id;

            //             // save the datapoint and check for errors
            //             newpoint.save(function (err) {
            //                 if (err) {
            //                     return next(logger.verror(err, 'Error while saving datapoint'));
            //                 }

            //                 var point = newpoint.toObject();
            //                 point.x = truncateTime(point.x);
            //                 return respond(res, true, {
            //                     message: 'Datapoint created for ' + req.body.x,
            //                     datapoint: point
            //                 });
            //             });
            //         }
            //     });
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

    // catch 404 and forward to error handler
    apiRouter.use(function (req, res, next) {
        next(createError(404, 'Page not found: ' + req.url));
    });

    // error handler
    apiRouter.use(handleError);

    return apiRouter;
}

module.exports = createAPIRouter;

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
        res.status(401);
        return respond(res, false, {
            message: 'Unauthorized'
        });
    }
    next();
}

function handleError(err, req, res, next) {
    logger.logError(err, 'API Error Handler');
    var statusCode = err.status || 500;
    res.status(statusCode);
    return respond(res, false, {
        message: process.env.NODE_ENV == 'production' ? err.message : err.stack
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