const moment = require('moment');

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
        getDatasetWithPoints(id, cb) {
            Dataset.findById(id, function (err, dataset) {
                if (err) return cb(err);

                // no dataset found
                if (!dataset) {
                    return cb(null, dataset);
                }

                // populate its datapoints
                Datapoint.find({
                        'dataset': dataset._id,
                    })
                    .sort({
                        x: 'asc'
                    })
                    .exec(function (err, datapoints) {
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
        }

    };
    return controller;
}

module.exports = createAPIController;

// helper function to truncate time values from date objects
function truncateTime(x) {
    return moment(x).utc().format('YYYY-MM-DD');
}