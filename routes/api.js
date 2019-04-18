// REQUIRES /////////////////////////////
const express = require('express'),
    moment = require('moment'),
    bodyParser = require('body-parser'),
    Dataset = require('../models/dataset'),
    Datapoint = require('../models/datapoint');

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

// use bodyparser on apiRouter to get POST vars
apiRouter.use(bodyParser.urlencoded({
    extended: true
}));
apiRouter.use(bodyParser.json());

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
apiRouter.get('/', function (req, res) {
    return res.json({
        message: 'hooray! welcome to our api!'
    });
});

// on routes that end in /sets
// ----------------------------------------------------
apiRouter.route('/sets')

    // POST = create a dataset
    .post([
        // validate / sanitize name
        body('name', 'Name is required.').not().isEmpty().trim().escape(),

        // validate / sanitize unit
        body('yAxisLabel', 'Unit is required.').not().isEmpty().trim().escape(),

        // sanitize chartType
        sanitizeBody('chartType').escape(),

        // Process request after validation and sanitization.
        (req, res, next) => {
            // Extract the validation errors from a request.
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
            dataset.chartType = req.body.chartType;
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
    ])

    // GET = get all the datasets
    .get(function (req, res) {
        Dataset.find()
            .sort({
                name: 'asc'
            })
            .exec(function (err, datasets) {
                if (err)
                    return res.send(err);

                return res.json(datasets);
            });
    });

// on routes that end in /sets/:id
// ----------------------------------------------------
apiRouter.route('/sets/:id')

    // GET = get the dataset (including data)
    .get(function (req, res) {
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
                    result.data = datapoints;

                    return res.json(result);
                });
        });
    })

    // PUT = update the dataset
    .put(function (req, res) {

        // use our dataset model to find the dataset we want
        Dataset.findById(req.params.id, function (err, dataset) {

            if (err)
                return res.send(err);

            // update the dataset's info
            ['name', 'chartType', 'xAxisLabel', 'yAxisLabel', 'precision'].forEach(function (element) {
                if (req.body[element] !== undefined)
                    dataset[element] = req.body[element];
            });

            // save the dataset
            dataset.save(function (err) {
                if (err)
                    return res.send(err);

                return res.json({
                    message: 'Dataset updated!'
                });
            });

        });
    })

    // DELETE = delete the dataset
    // TO DO: what to do about the points?
    .delete(function (req, res) {
        Dataset.findByIdAndDelete(req.params.id, function (err, dataset) {
            if (err)
                res.send(err);

            res.json({
                message: 'Successfully deleted ' + (dataset ? dataset.name : '')
            });
        });
    });

// on routes that end in /sets/:id/data
// ----------------------------------------------------
apiRouter.route('/sets/:id/data')

    // POST = create OR UPDATE a datapoint

    //TO DO: validation like creating a datapoint
    .post([
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

            // Create/update datapoint with validated / sanitized data
            Datapoint.findOne({
                    dataset: req.params.id,
                    x: req.body.x
                })
                .exec((err, datapoint) => {
                    if (err)
                        return res.send(err);

                    if (datapoint) {
                        // update or delete?
                        if (req.body.delete == "1") {
                            datapoint.delete((err) => {
                                if (err)
                                    return res.send(err);

                                return res.json({
                                    success: 'true',
                                    message: 'Datapoint deleted'
                                });
                            });
                        } else {
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
                        if (req.body.delete == "1") {
                            return res.json({
                                success: false,
                                errors: [{
                                    msg: "No datapoint to delete"
                                }]
                            });
                        }

                        var newpoint = new Datapoint();
                        newpoint.x = req.body.x;
                        newpoint.y = req.body.y;
                        newpoint.dataset = req.params.id;

                        // save the datapoint and check for errors
                        newpoint.save(function (err) {
                            if (err)
                                return res.send(err);
                            data.success = true;
                            data.message = 'Datapoint created for date ' + req.body.x;
                            return res.json(data);
                        });
                    }
                });
        }
    ])

    // GET = get all the datapoints for this set (obsolete)
    .get(function (req, res) {
        Datapoint.find({
                'dataset': req.params.id,
            })
            .sort({
                x: 'asc'
            })
            .exec(function (err, datapoints) {
                if (err)
                    return res.send(err);
                return res.json(datapoints);
            });
    });

// on routes that end in /sets/:id/range/:start/:end
// ----------------------------------------------------
apiRouter.route('/sets/:id/range/:start/:end')

    // get a range of datapoints for a dataset
    .get(function (req, res) {
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

// on routes that end in /points/:id
// ----------------------------------------------------
apiRouter.route('/points/:id')

    // GET = get a single datapoint - kinda redundant
    .get(function (req, res) {
        // grab the dataset from the db
        Datapoint.findById(req.params.id, function (err, datapoint) {
            if (err)
                return res.send(err);

            return res.json(datapoint);
        });
    })

    // PUT = update the datapoint
    .put(function (req, res) {
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