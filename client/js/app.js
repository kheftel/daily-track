var module = require('./modules/samplemodule');
var ChartController = require('./modules/ChartController');
var Controller = require('./modules/ChartController');

window.helpers = window.helpers || {};

window.helpers.createChartControllerFromModel = function(container, dataset) {
    var controller = new ChartController(container);
    controller.addDatasetFromModel(dataset);
    return controller;
}

window.helpers.createChartControllerFromId = function(container, id) {
    var controller = new ChartController(container);
    controller.addDataset(id);
    return controller;
}


$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
});


// set up variables ///////////////

// $(() => {
//     console.log('main onload');

//     // controller for chart
//     var controller = new ChartController('mainChart');
//     controller.addDataset('5ca00f23f968e4b0a2f36e0e', function() {
//         controller.addDataset('5ca4dc5a85df2293711ef8a8');
//     });
//     window.controller = controller;

//     console.log('setting up interactivity');

//     $('#minus').click(() => {
//         controller.zoomOut();
//     });

//     $('#plus').click(() => {
//         controller.zoomIn();
//     });

//     $('#left').click(() => {
//         controller.panLeft();
//     });

//     $('#right').click(() => {
//         controller.panRight();
//     });

//     $('#showall').click(() => {
//         controller.showAll();
//     });
// });