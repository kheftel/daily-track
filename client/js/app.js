var module = require('./modules/samplemodule');
var ChartController = require('./modules/ChartController');

// set up variables ///////////////

$(() => {
    console.log('main onload');

    // controller for chart
    var controller = new ChartController('mainChart');
    window.controller = controller;

    //getData();

    console.log('setting up interactivity');

    $('#minus').click(() => {
        controller.zoomOut();
    });

    $('#plus').click(() => {
        controller.zoomIn();
    });

    $('#left').click(() => {
        controller.panLeft();
    });

    $('#right').click(() => {
        controller.panRight();
    });

    $('#showall').click(() => {
        controller.showAll();
    });
});