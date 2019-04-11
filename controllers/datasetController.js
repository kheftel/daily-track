const {
    body,
    validationResult
} = require('express-validator/check');

const {
    sanitizeBody
} = require('express-validator/filter');

const Dataset = require('../models/dataset');

// Display list of all Datasets.
exports.list = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset list');
};

// Display detail page for a specific Dataset.
exports.detail = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset detail: ' + req.params.id);
};

// Display Dataset create form on GET.
exports.create_get = function (req, res, next) {
    res.render('set_form', {
        title: 'Create Dataset'
    });
};

// Handle Dataset create on POST.
exports.create_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset create POST');
};

// Display Dataset delete form on GET.
exports.delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset delete GET');
};

// Handle Dataset delete on POST.
exports.delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset delete POST');
};

// Display Dataset update form on GET.
exports.update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset update GET');
};

// Handle Dataset update on POST.
exports.update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Dataset update POST');
};