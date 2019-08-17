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
    },
    tags: {
        type: Array,
        required: false
    }
});

module.exports = mongoose.model('Datapoint', DatapointSchema);