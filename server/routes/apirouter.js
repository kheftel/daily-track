// REQUIRES /////////////////////////////
const express = require('express');
const ApiController = require('../controllers/apicontroller');

const {
    body,
    check,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody,
    Sanitizers
} = require('express-validator/filter');

require('moment-round');

// API /////////////////////////////
function ApiRouter({
    backendService
}) {
    const api = ApiController(backendService);

    var apiRouter = express.Router();

    apiRouter.use(express.urlencoded({
        extended: true
    }));
    apiRouter.use(express.json());

    // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    apiRouter.get('/', api.test());

    // register user - the only unprotected endpoint. maybe ensure logged out?
    apiRouter.post('/register', api.register());

    // log in
    apiRouter.post('/login', api.login());

    // get all the datasets
    apiRouter.get('/sets', api.getDatasets());

    // create a dataset
    apiRouter.post('/sets', api.createDataset());

    // get dataset (includes datapoints)
    apiRouter.get('/sets/:id', api.getDataset());

    // update OR delete a dataset
    apiRouter.post('/sets/:id', api.updateOrDeleteDataset());

    // create OR update OR delete a datapoint
    apiRouter.post('/sets/:id/data', api.createOrUpdateOrDeleteDatapoint());

    // get a range of datapoints for a dataset
    // apiRouter.get('/sets/:id/range/:start/:end', function (req, res) {
    //     Datapoint.find({
    //             'dataset': req.params.id,
    //         })
    //         .where('x').gte(req.params.start).lte(req.params.end)
    //         .sort({
    //             x: 'asc'
    //         })
    //         .exec(function (err, datapoints) {
    //             if (err) {
    //                 common.logError(err, 'Error while getting range of datapoints');
    //                 return respond(res, false, {
    //                     error: err
    //                 });
    //             }
    //             return res.json(datapoints);
    //         });
    // });

    // catch 404 and forward to error handler
    apiRouter.use(api.create404());

    // error handler
    apiRouter.use(api.handleError());

    return apiRouter;
}

module.exports = ApiRouter;