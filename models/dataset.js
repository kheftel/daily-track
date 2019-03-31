var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DatasetSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    chartType: {
        type: String,
        required: true,
        enum: ['line', 'bar'],
        default: 'line'
    },
    xAxisLabel: {
        type: String,
        required: true,
        default: 'Date'
    },
    yAxisLabel: {
        type: String,
        required: true,
        default: 'Minutes'
    },
    precision: {
        type: String,
        required: true,
        enum: ['daily', 'any'],
        default: 'daily'
    }
});

/*scales: {
    xAxes: [{
        type: 'time',
        distribution: 'linear',
        display: true,
        scaleLabel: {
            display: true,
            labelString: 'Date'
        },
    }],
    yAxes: [{
        display: true,
        scaleLabel: {
            display: true,
            labelString: 'Minutes'
        }
    }]
}*/

module.exports = mongoose.model('Dataset', DatasetSchema);