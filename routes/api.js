// REQUIRES /////////////////////////////
const express = require('express'),
    moment = require('moment'),
    bodyParser = require('body-parser'),
    Dataset = require('../models/dataset'),
    Datapoint = require('../models/datapoint');

const {
    body,
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
    res.json({
        message: 'hooray! welcome to our api!'
    });
});

// on routes that end in /sets
// ----------------------------------------------------
apiRouter.route('/sets')

    // POST = create a dataset
    .post([
        // validate / sanitize name
        body('name', 'Name is required.').isLength({
            min: 1
        }).trim(),
        sanitizeBody('name').escape(),

        // validate / sanitize unit
        body('yAxisLabel', 'Unit is required.').isLength({
            min: 1
        }).trim(),
        sanitizeBody('yAxisLabel').escape(),

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
                    res.send(err);
                data.success = true;
                data.message = 'Dataset created!';
                res.json(data);
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
                    res.send(err);

                res.json(datasets);
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
                res.send(err);

            // populate its datapoints
            Datapoint.find({
                    'dataset': req.params.id,
                })
                .sort({
                    x: 'asc'
                })
                .exec(function (err, datapoints) {
                    if (err)
                        res.send(err);

                    var result = dataset.toObject();
                    result.data = datapoints;

                    res.json(result);
                });
        });
    })

    // PUT = update the dataset
    .put(function (req, res) {

        // use our dataset model to find the dataset we want
        Dataset.findById(req.params.id, function (err, dataset) {

            if (err)
                res.send(err);

            // update the dataset's info
            ['name', 'chartType', 'xAxisLabel', 'yAxisLabel', 'precision'].forEach(function (element) {
                if (req.body[element] !== undefined)
                    dataset[element] = req.body[element];
            });

            // save the dataset
            dataset.save(function (err) {
                if (err)
                    res.send(err);

                res.json({
                    message: 'Dataset updated!'
                });
            });

        });
    }); //,

// DELETE = delete the dataset
// TO DO: what to do about the points?
// .delete(function (req, res) {
//     Dataset.remove({
//         _id: req.params.id
//     }, function (err, dataset) {
//         if (err)
//             res.send(err);

//         res.json({
//             message: 'Successfully deleted'
//         });
//     });
// });

// on routes that end in /sets/:id/data
// ----------------------------------------------------
apiRouter.route('/sets/:id/data')

    // POST = create a datapoint
    .post(function (req, res) {

        Dataset.findById(req.params.id, function (err, dataset) {
            if (err)
                res.send(err);

            // date should be submitted as a UTC string in YYYY-MM-DD format
            // enforce date only by truncating time portion
            var truncatedDateString = moment(new Date(req.body.x).toISOString()).utc().format('YYYY-MM-DD');

            // enforce one data point per date
            Datapoint.find({
                    'dataset': req.params.id
                })
                .exec(function (err, points) {
                    if (err)
                        res.send(err);

                    var m = moment.utc(truncatedDateString);
                    for (var i = 0; i < points.length; i++) {
                        console.log('comp: ' + truncatedDateString + ' and ' + moment.utc(points[i].x).format('YYYY-MM-DD'));
                        if (m.isSame(points[i].x, 'day')) {
                            console.log('match');
                            res.json({
                                message: 'Error, only one data point per date!'
                            });
                            return;
                        }
                    }

                    var datapoint = new Datapoint();
                    datapoint.dataset = dataset._id;
                    datapoint.x = truncatedDateString;
                    // enforce integer y values
                    datapoint.y = Math.round(req.body.y);

                    // save the datapoint and check for errors
                    datapoint.save(function (err) {
                        if (err)
                            res.send(err);

                        res.json({
                            message: 'Datapoint created!'
                        });
                    });
                });
        });
    })

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
                    res.send(err);
                res.json(datapoints);
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
                    res.send(err);
                res.json(datapoints);
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
                res.send(err);

            res.json(datapoint);
        });
    })

    // PUT = update the datapoint
    .put(function (req, res) {
        Datapoint.findById(req.params.id, function (err, datapoint) {
            if (err)
                res.send(err);

            // update the datapoint's info - for now, only y supported
            // TO DO: update datapoint's x value, but test for dups
            ['y'].forEach(function (element) {
                if (req.body[element] !== undefined)
                    datapoint[element] = req.body[element];
            });

            // save the datapoint
            datapoint.save(function (err) {
                if (err)
                    res.send(err);

                res.json({
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