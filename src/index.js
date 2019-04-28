var ChartController = require('./js/ChartController');
require('jquery');
require('popper.js');
require('bootstrap');
require('moment');
require('chart.js');
require('./js/lib/bootstrap-confirmation.min');
// require('./js/lib/tempusdominus-bootstrap-4.min');
require('./js/lib/toast');
require('./js/lib/chartjs-plugin-vh-line');
require('./js/lib/picker');
require('./js/lib/picker.date');

import './css/bootstrap-darkly.css';
import './less/style.less';
import './css/toast.css';
// import './css/tempusdominus-bootstrap-4.min.css';
import './css/pickadate/default.css';
import './css/pickadate/default.date.css';
// import './css/fontawesome-v5.8.1-solid.css';
// import './css/fontawesome-v5.8.1-fontawesome.css';
import './favicon.ico';

window.helpers = window.helpers || {};

window.helpers.createChartControllerFromModel = function(container, dataset) {
    var controller = new ChartController(container);
    controller.addDatasetFromModel(dataset);
    return controller;
};

window.helpers.createChartControllerFromId = function(container, id) {
    var controller = new ChartController(container);
    controller.addDataset(id);
    return controller;
};

$(document).ready(function () {
    // backdrop for sidebar to block touches on content
    var sidebarbackdrop = document.createElement('div');
    sidebarbackdrop.id = 'sidebar-shade';
    $(sidebarbackdrop).addClass('modal-backdrop fade show d-md-none');

    // click handler for menu button
    $('#sidebarCollapse').on('click', function () {
        // current state of sidebar
        var sidebarActive = $('#sidebar').hasClass('active');

        // toggle sidebar state
        sidebarActive = !sidebarActive;

        if(sidebarActive) {
            $('#sidebar').addClass('active');
            // $('#sidebar-shade').addClass('show');
            document.body.appendChild(sidebarbackdrop);
            $('#content').addClass('blur blur-md-none');
            $('body').addClass('sidebar-active');
        }
        else {
            $('#sidebar').removeClass('active');
            // $('#sidebar-shade').removeClass('show');
            document.body.removeChild(sidebarbackdrop);
            $('#content').removeClass('blur blur-md-none');
            $('body').removeClass('sidebar-active');
        }

        // // slide sidebar
        // $('#sidebar').toggleClass('active');

        // // blur content
        // $('#content').toggleClass('fx-blur-when-small');

        // // disable body scrolling
        // $('body').toggleClass('modal-open');

        // // show backdrop
        // $('#sidebar-shade').toggleClass('show');
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