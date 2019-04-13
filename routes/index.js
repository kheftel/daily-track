// INDEX /////////////////////////////
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const _ = require('lodash');

const set_controller = require('../controllers/datasetController');

// template data
var state = {
    siteTitle: 'DailyTrack',
    nav: [{
            title: 'Datasets',
            icon: 'fa-list',
            href: '/'
        },
        {
            title: 'New Dataset',
            icon: 'fa-plus',
            href: '/set/create'
        },
        {
            title: 'Multi-View',
            icon: 'fa-chart-pie',
            href: '/multi'
        }
    ]
};

// prep state
router.use(function (req, res, next) {
    console.log('initialization: ' + req.path);

    // reset active states
    state.nav.forEach(element => {
        element.active = undefined;
    });
    // mark current page as active
    let activenav = _.find(state.nav, {
        href: req.path
    });
    if (activenav)
        activenav.active = true;

    // add nav, site title to locals
    res.locals.siteTitle = state.siteTitle;
    res.locals.nav = state.nav;
    console.log('locals:');
    console.log(res.locals);

    // console.log(req.baseUrl);
    // console.log(req.originalUrl);

    next();
});

// charts overview page
router.get('/', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                res.send(err);

            res.locals.datasets = datasets;

            res.render('index', state);
        });
});

router.get('/set/create', set_controller.create_get);
router.post('/set/create', set_controller.create_post);
router.get('/set/:id/delete', set_controller.delete_get);
router.post('/set/:id/delete', set_controller.delete_post);
router.get('/set/:id/update', set_controller.update_get);
router.post('/set/:id/update', set_controller.update_post);
router.get('/set/:id', set_controller.detail);
router.get('/sets', set_controller.list);

// multi view
router.get('/multi', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                res.send(err);

            res.locals.datasets = datasets;

            res.render('multi', state);
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

                state.dataset = result;

                res.render('chart', state);
            });
    });
});

// create new data point

module.exports = router;