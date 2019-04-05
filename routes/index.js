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


    res.render('charts', {
        title: 'DailyTrack'
    });
});

module.exports = router;