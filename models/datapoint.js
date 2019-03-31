var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DatapointSchema = new Schema({
    dataset: {
        type: Schema.Types.ObjectId,
        ref: 'Dataset',
        required: true
    }, //reference to the associated dataset
    x: {
        type: Date,
        required: true
    },
    y: {
        type: Number,
        required: true
    }
});

/*
{
    "type": "line",
    "label": "Meditation",
    "data": [{
        "x": "2019-03-01",
        "y": 0
    }, {
        "x": "2019-03-02",
        "y": 22
    }
}
*/

module.exports = mongoose.model('Datapoint', DatapointSchema);