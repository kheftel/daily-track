// INDEX /////////////////////////////
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const _ = require('lodash');
const moment = require('moment');

const set_controller = require('../controllers/datasetController');

// template data
var state = {
    siteTitle: 'DailyTrack',
    nav: [{
            title: 'Datasets',
            icon: 'fa-list',
            path: '/'
        },
        {
            title: 'New Dataset',
            icon: 'fa-plus-square',
            path: '/set/new',
            noscroll: true
        },
        {
            title: 'Multi-View',
            icon: 'fa-chart-pie',
            path: '/multi',
            noscroll: true
        }
    ],
    dynamic: [{
        regex: /^\/set\/.+/, //match /set/STUFF
        title: 'Dataset Detail',
        icon: '',
        noscroll: true
    }]
};

// prep state
router.use(function (req, res, next) {
    console.log('initialization: ' + req.path);

    // configure template locals
    res.locals.siteTitle = state.siteTitle;
    res.locals.nav = state.nav;
    res.locals.req = {
        path: req.path
    };

    // grab current page from nav
    let active = _.find(state.nav, {
        path: req.path
    });

    // add info about current page
    if (active) {
        res.locals.active = active;
        setPageTitle(res, active.title);
    } else {
        // try dyanmic pages
        state.dynamic.forEach((v, k, col) => {
            if (v.regex && v.regex.test(req.path)) {
                // match!
                console.log('matched a dynamic page');
                res.locals.active = v;
                if (v.title)
                    setPageTitle(res, v.title);
            }
        });
    }
    console.log('locals:');
    console.log(res.locals);

    // pass some node module utility stuff along too!
    res.locals.moment = moment;

    next();
});

// list all datasets
router.get('/', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                return next(err);

            res.locals.datasets = datasets;
            res.render('datasets');
        });
});


// new dataset
router.get('/set/new', function (req, res, next) {
    res.render('set_form');
});

// view dataset
router.get('/set/:id', function (req, res, next) {

    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        if (err)
            return next(err);

        // populate chart's datapoints
        Datapoint.find({
                'dataset': req.params.id,
            })
            .sort({
                x: 'asc'
            })
            .exec(function (err, datapoints) {
                if (err)
                    return next(err);

                // setPageTitle(res, dataset.name);

                var result = dataset.toObject();
                result.data = datapoints;
                res.locals.dataset = result;
                res.render('dataset');
            });
    });
});

// new data point on a dataset
router.get('/set/:id/new', function (req, res, next) {
    console.log('new data point form');

    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        if (err)
            return next(err);

        if(!dataset) {
            console.log('no dataset found');

            // dataset not found
            return next('Dataset not found');
        }

        var result = dataset.toObject();
        res.locals.dataset = result;

        var active = {
            title: dataset.name + ': add entry',
            noscroll: true
        };
        res.locals.active = active;
        setPageTitle(res, active.title);

        // today's date
        res.locals.defaults = {
            x: moment().format('YYYY-MM-DD')
        };

        res.render('point_form');
    });
});

// view multiple datasets on the same chart
router.get('/multi', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                return next(error);

            res.locals.datasets = datasets;
            res.render('multi');
        });
});

// helper functions

/**
 * add page title to res.locals
 * @param {*} res 
 * @param {*} title 
 */
function setPageTitle(res, title) {
    res.locals.pageTitle = title;
    res.locals.siteTitle = state.siteTitle + ' - ' + title;
}

// router.post('/set/create', set_controller.create_post);
// router.get('/set/:id/delete', set_controller.delete_get);
// router.post('/set/:id/delete', set_controller.delete_post);
// router.get('/set/:id/update', set_controller.update_get);
// router.post('/set/:id/update', set_controller.update_post);
// router.get('/set/:id', set_controller.detail);
// router.get('/sets', set_controller.list);

module.exports = router;