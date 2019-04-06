// INDEX /////////////////////////////
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'DailyTrack'
    });
});

// chart detail page
router.get('/chart', function (req, res, next) {
    res.render('chart', {
        title: 'DailyTrack'
    });
});

// charts list
router.get('/charts', function (req, res, next) {
    Dataset.find(function (err, datasets) {
        //to do: do something useful with error
        // if (err)
        //     res.send(err);

        res.locals.datasets = datasets;

        res.render('charts', {
            title: 'DailyTrack'
        });
    });
});

// chart detail
router.get('/chart/:id', function (req, res, next) {

    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        // TO DO: handle error
        if (err)
            res.send(err);

        // populate chart's datapoints
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

                res.render('chart', {
                    title: 'DailyTrack',
                    dataset: result
                });
            });
    });
});

module.exports = router;