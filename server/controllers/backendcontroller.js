const moment = require('moment');
const VError = require('verror');

function BackendController(backend) {
    const Dataset = backend.getModel('Dataset');
    const Datapoint = backend.getModel('Datapoint');
    let controller = {
        getDataset(id, cb) {
            Dataset.findById(id, (err, dataset) => {
                if (err) return cb(err);
                return cb(null, dataset);
            });
        },
        getDatasetsForUser(id, cb) {
            controller.getDatasetsForUserSortedBy(id, { name: 'asc' }, cb);
        },
        getDatasetsForUserSortedBy(id, sort, cb) {
            Dataset.find({
                owner: id
            })
                .sort(sort)
                .exec(cb);
        },
        getDatasetsForUserSortedByUnit(id, cb) {
            controller.getDatasetsForUserSortedBy(id, { yAxisLabel: 'asc' }, cb);
        },
        getDatasetsForUserAndLabel(id, label, cb) {
            Dataset.find({
                owner: id,
                yAxisLabel: label,
            })
                .sort({
                    name: 'asc'
                })
                .exec(cb);
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
                        datapoint = new Datapoint();
                        datapoint.dataset = datasetid;
                        for (let k in options) {
                            datapoint[k] = options[k];
                        }

                    } else {
                        // update
                        datapoint.y = options.y;
                        datapoint.tags = options.tags;
                    }

                    var point = datapoint.toObject();
                    point.x = truncateTime(point.x);

                    // save the datapoint
                    datapoint.save((err) => {
                        if (err) return cb(err);

                        return cb(null, {
                            success: true,
                            datapoint: point
                        });
                    });
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

module.exports = BackendController;

// helper function to truncate time values from date objects
function truncateTime(x) {
    return moment(x).utc().format('YYYY-MM-DD');
}