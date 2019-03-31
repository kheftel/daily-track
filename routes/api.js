// REQUIRES /////////////////////////////
const express = require('express'),
    moment = require('moment'),
    bodyParser = require('body-parser'),
    Dataset = require('../models/dataset'),
    Datapoint = require('../models/datapoint');

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

    // create a dataset (accessed at POST http://localhost:8080/api/sets)
    .post(function (req, res) {

        var dataset = new Dataset(); // create instance of model
        dataset.name = req.body.name; // set data from request

        ['chartType', 'xAxisLabel', 'yAxisLabel', 'precision'].forEach(function (element) {
            if (req.body[element] !== undefined)
                dataset[element] = req.body[element];
        });

        // save the dataset and check for errors
        dataset.save(function (err) {
            if (err)
                res.send(err);

            res.json({
                message: 'Dataset created!'
            });
        });

    })

    // get all the datasets (accessed at GET http://localhost:8080/api/sets)
    .get(function (req, res) {
        Dataset.find(function (err, datasets) {
            if (err)
                res.send(err);

            res.json(datasets);
        });
    });

// on routes that end in /sets/:id
// ----------------------------------------------------
apiRouter.route('/sets/:id')

    // get the dataset with that id (accessed at GET http://localhost:8080/api/sets/:id)
    .get(function (req, res) {
        Dataset.findById(req.params.id, function (err, dataset) {
            if (err)
                res.send(err);
            res.json(dataset);
        });
    })

    // update the dataset with this id (accessed at PUT http://localhost:8080/api/sets/:id)
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
    })

    // delete the dataset with this id (accessed at DELETE http://localhost:8080/api/sets/:id)
    .delete(function (req, res) {
        Dataset.remove({
            _id: req.params.id
        }, function (err, dataset) {
            if (err)
                res.send(err);

            res.json({
                message: 'Successfully deleted'
            });
        });
    });

// on routes that end in /sets/:id/points
// ----------------------------------------------------
apiRouter.route('/sets/:id/points')

    // create a datapoint (accessed at POST http://localhost:8080/api/sets/:id/points)
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

    // get all the datapoints for a dataset (accessed at GET http://localhost:8080/api/sets/:id/points/)
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

// on routes that end in /sets/:id/points/:start/:end
// ----------------------------------------------------
apiRouter.route('/sets/:id/points/:start/:end')

    // get a range of datapoints for a dataset (accessed at GET http://localhost:8080/api/sets/:id/points/:start/:end)
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