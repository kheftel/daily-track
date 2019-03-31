// REQUIRES /////////////////////////////
const express = require('express'),
    moment = require('moment'),
    bodyParser = require('body-parser'),
    Dataset = require('../models/dataset'),
    Datapoint = require('../models/datapoint');

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

// on routes that end in /datasets
// ----------------------------------------------------
apiRouter.route('/datasets')

    // create a dataset (accessed at POST http://localhost:8080/api/datasets)
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

    // get all the datasets (accessed at GET http://localhost:8080/api/datasets)
    .get(function (req, res) {
        Dataset.find(function (err, datasets) {
            if (err)
                res.send(err);

            res.json(datasets);
        });
    });

// on routes that end in /datasets/:dataset_id
// ----------------------------------------------------
apiRouter.route('/datasets/:dataset_id')

    // get the dataset with that id (accessed at GET http://localhost:8080/api/datasets/:dataset_id)
    .get(function (req, res) {
        Dataset.findById(req.params.dataset_id, function (err, dataset) {
            if (err)
                res.send(err);
            res.json(dataset);
        });
    })

    // update the dataset with this id (accessed at PUT http://localhost:8080/api/datasets/:dataset_id)
    .put(function (req, res) {

        // use our dataset model to find the dataset we want
        Dataset.findById(req.params.dataset_id, function (err, dataset) {

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

    // delete the dataset with this id (accessed at DELETE http://localhost:8080/api/datasets/:dataset_id)
    .delete(function (req, res) {
        Dataset.remove({
            _id: req.params.dataset_id
        }, function (err, dataset) {
            if (err)
                res.send(err);

            res.json({
                message: 'Successfully deleted'
            });
        });
    });

// on routes that end in /datasets/:dataset_id/datapoints
// ----------------------------------------------------
apiRouter.route('/datasets/:dataset_id/datapoints')

    // create a datapoint (accessed at POST http://localhost:8080/api/datasets/:dataset_id/datapoints)
    .post(function (req, res) {

        Dataset.findById(req.params.dataset_id, function (err, dataset) {
            if (err)
                res.send(err);

            var datapoint = new Datapoint();
            datapoint.dataset = req.params.dataset_id;
            datapoint.x = req.body.x;
            datapoint.y = req.body.y;

            // save the datapoint and check for errors
            datapoint.save(function (err) {
                if (err)
                    res.send(err);

                res.json({
                    message: 'Datapoint created!'
                });
            });
        });
    })

    // get all the datapoints for a dataset (accessed at GET http://localhost:8080/api/datasets/:dataset_id/datapoints/)
    .get(function (req, res) {
        Dataset.findById(req.params.dataset_id, function (err, dataset) {
            if (err)
                res.send(err);

            Datapoint.find({ 'dataset':req.params.dataset_id }, function (err, datapoints) {
                if (err)
                    res.send(err);
                
                /*var retval = [];
                for(var i = 0; i < datapoints.length; i++) {
                    var formattedDateString = moment(datapoints[i].x).format("YYYY-MM-DD");
                    
                    retval.push({
                        _id: datapoints[i]._id,
                        x: formattedDateString,
                        y: datapoints[i].y
                    });

                    console.log(datapoints[i]);
                }

                res.json(retval);*/

                res.json(datapoints);
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