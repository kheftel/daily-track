// DEFAULT ROUTER /////////////////////////////
const express = require('express');
const mongoose = require('mongoose');
const Dataset = require('../models/dataset');
const Datapoint = require('../models/datapoint');
const User = require('../models/user');
const passport = require('passport');
const _ = require('lodash');
const moment = require('moment');

const set_controller = require('../controllers/datasetController');

const defaultRouter = express.Router();

// template data
var state = {
    siteTitle: 'DailyTrack',
    nav: [{
            title: 'Overview',
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
            noscroll: true,
            notitle: true
        }
    ],
    dynamic: [{
        regex: /^\/set\/.+\/edit/, //match /set/id/edit
        title: 'Edit Dataset',
        icon: '',
        noscroll: true
    }, {
        regex: /^\/set\/.+/, //match /set/id
        title: 'Dataset Detail',
        icon: '',
        noscroll: true,
        notitle: true
    }],
    style: {
        chartRowHeight: '320px'
    }
};

// prep state
defaultRouter.use(function (req, res, next) {
    console.log('initialization: ' + req.path);

    // configure template locals
    res.locals.siteTitle = state.siteTitle;
    res.locals.nav = state.nav;
    res.locals.style = state.style;
    res.locals.req = {
        path: req.path
    };
    res.locals.user = req.user;

    // grab current page from nav
    let active = _.find(state.nav, {
        path: req.path
    });

    // add info about current page
    if (active) {
        res.locals.active = active;
        setPageTitle(res, active.title);
    } else {
        // try dynamic pages
        state.dynamic.some((v, k, col) => {
            console.log(v.regex + ' testing vs ' + req.path);
            if (v.regex && v.regex.test(req.path)) {
                // match!
                console.log('matched a dynamic page');
                res.locals.active = v;
                if (v.title)
                    setPageTitle(res, v.title);
                //break loop
                return true;
            }
        });
    }
    console.log('locals:');
    console.log(res.locals);

    // pass some node module utility stuff along too!
    res.locals.moment = moment;

    next();
});

// show overview page
defaultRouter.get('/', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                return next(err);

            res.locals.datasets = datasets;

            // today's date
            res.locals.defaults = {
                x: moment().format('YYYY-MM-DD')
            };

            res.render('overview');
        });
});

// register
defaultRouter.get('/register', function (req, res) {
    res.render('register');
});

// login
defaultRouter.get('/login', function (req, res) {
    res.render('login');
});

defaultRouter.post('/login', passport.authenticate('local'), function (req, res) {
    res.redirect('/');
});

// logout
defaultRouter.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// deprecated: all dataset detail views on one page
defaultRouter.get('/datasets', function (req, res, next) {
    Dataset.find()
        .sort({
            name: 'asc'
        })
        .exec(function (err, datasets) {
            //to do: do something useful with error
            if (err)
                return next(err);

            res.locals.datasets = datasets;

            // today's date
            res.locals.defaults = {
                x: moment().format('YYYY-MM-DD')
            };

            res.render('datasets');
        });
});

// new dataset
defaultRouter.get('/set/new', function (req, res, next) {
    res.render('set_form');
});

// view dataset
defaultRouter.get('/set/:id', function (req, res, next) {

    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        if (err)
            return next(err);

        if (!dataset) {
            console.log('no dataset found');

            // dataset not found
            return next(new Error('Dataset not found'));
        }

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

// edit dataset
defaultRouter.get('/set/:id/edit', function (req, res, next) {
    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        if (err)
            return next(err);

        if (!dataset) {
            console.log('no dataset found');

            // dataset not found
            return next(new Error('Dataset not found'));
        }
        var result = dataset.toObject();
        res.locals.dataset = result;

        res.render('set_form');
    });
});

// new data point on a dataset
defaultRouter.get('/set/:id/new', function (req, res, next) {
    console.log('new data point form');

    // grab the dataset from the db
    Dataset.findById(req.params.id, function (err, dataset) {
        if (err)
            return next(err);

        if (!dataset) {
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
defaultRouter.get('/multi', function (req, res, next) {
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

module.exports = defaultRouter;