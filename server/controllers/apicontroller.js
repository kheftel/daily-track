const moment = require('moment');
const VError = require('verror');

function createAPIController(backendService) {
    const Dataset = backendService.getModel('Dataset');
    const Datapoint = backendService.getModel('Datapoint');
    let controller = {
        getDatasetsForUser(id, cb) {
            Dataset.find({
                    owner: id
                })
                .sort({
                    name: 'asc'
                })
                .exec(cb);
        },
        getDataset(id, cb) {
            Dataset.findById(id, (err, dataset) => {
                if (err) return cb(err);
                return cb(null, dataset);
            });
        },
        getDatasetWithPoints(id, cb) {
            controller.getDataset(id, (err, dataset) => {
                if (err) return cb(err);

                // no dataset found, return null
                if (!dataset) return cb(null, dataset);

                // populate its datapoints
                Datapoint.find({
                        'dataset': dataset._id,
                    })
                    .sort({
                        x: 'asc'
                    })
                    .exec((err, datapoints) => {
                        if (err) return cb(err);

                        let result = dataset.toObject();

                        // truncate to date only
                        for (let i = 0; i < datapoints.length; i++) {
                            var point = datapoints[i].toObject();
                            point.x = truncateTime(point.x);
                            datapoints[i] = point;
                        }

                        // return populated set
                        result.data = datapoints;
                        cb(null, result);
                    });
            });
        },
        updateDatasetForUser(userid, datasetid, options, cb) {
            Dataset.findOne({
                owner: userid,
                _id: datasetid
            }).exec((err, dataset) => {
                if (err) return cb(err);

                if (!dataset) return cb(null, {
                    success: false,
                    message: 'No dataset found or you do not have permission to update.',
                });

                for (let k in options) {
                    dataset[k] = options[k];
                }
                dataset.save(cb);
            });
        },
        deleteDatasetForUser(userid, datasetid, cb) {
            Dataset.findOne({
                owner: userid,
                _id: datasetid
            }).exec((err, dataset) => {
                if (err) return cb(err);

                if (!dataset) return cb(null, {
                    success: false,
                    mesasge: 'No dataset found or you do not have permission to delete.',
                });

                // check nonempty
                Datapoint.findOne({
                        dataset: datasetid
                    })
                    .exec((err, datapoint) => {
                        if (err) return cb(err);

                        if (datapoint) return cb(null, {
                            success: false,
                            message: 'Cannot delete nonempty dataset',
                        });

                        dataset.delete(cb);
                    });
            });
        },
        createOrUpdateDatapointForDataset(datasetid, options, cb) {
            Datapoint.findOne({
                    dataset: datasetid,
                    x: options.x
                })
                .exec((err, datapoint) => {
                    if (err) return cb(err);

                    if (!datapoint) {
                        // create new one
                        let newpoint = new Datapoint();
                        newpoint.dataset = datasetid;
                        for (let k in options) {
                            newpoint[k] = options[k];
                        }

                        // save the datapoint
                        newpoint.save(cb);
                    } else {
                        // update
                        datapoint.y = options.y;
                        datapoint.tags = options.tags;
                        datapoint.save(cb);
                    }
                });
        },
        deleteDatapoint(datasetid, options, cb) {
            Datapoint.findOne({
                    dataset: datasetid,
                    x: options.x
                })
                .exec((err, datapoint) => {
                    if (err) return cb(err);

                    if (!datapoint) {
                        return cb(null, {
                            success: false,
                            message: 'no datapoint to delete',
                        });
                    }

                    // delete datapoint
                    var deletedPoint = datapoint.toObject();
                    deletedPoint.x = truncateTime(deletedPoint.x);
                    datapoint.delete((err) => {
                        if (err) return cb(err);

                        return cb(null, {
                            success: true,
                            datapoint: deletedPoint,
                        });
                    });
                });
        },
    };
    return controller;
}

module.exports = createAPIController;

// helper function to truncate time values from date objects
function truncateTime(x) {
    return moment(x).utc().format('YYYY-MM-DD');
}