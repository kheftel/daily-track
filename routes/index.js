// INDEX /////////////////////////////
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const _ = require('lodash');

// template data
var state = {
    siteTitle: 'DailyTrack',
    nav: [{
            title: 'Charts',
            href: '/'
        },
        {
            title: 'Multi-View',
            href: '/multi'
        }
    ]
};

// prep state
router.use(function (req, res, next) {
    // reset active states
    state.nav.forEach(element => {
        element.active = undefined;
    });
    // mark current page as active
    let activenav = _.find(state.nav, {
        href: req.path
    });
    if(activenav) activenav.active = true;

    // console.log(req.path);
    // console.log(req.baseUrl);
    // console.log(req.originalUrl);

    next();
});

// charts
router.get('/', function (req, res, next) {
    Dataset.find(function (err, datasets) {
        //to do: do something useful with error
        // if (err)
        //     res.send(err);

        res.locals.datasets = datasets;

        res.render('index', state);
    });
});

// chart detail page
router.get('/chart', function (req, res, next) {
    res.render('chart', state);
});

// multi view
router.get('/multi', function (req, res, next) {
    res.render('multi', state);
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

                state.dataset = result;

                res.render('chart', state);
            });
    });
});

module.exports = router;