// jquery/bootstrap/ui stuff
require('jquery');
require('popper.js');
require('bootstrap');
require ('bootstrap-confirmation2');
// require('./js/lib/bootstrap-confirmation');
require('./js/lib/toast');
require('./js/lib/picker');
require('./js/lib/picker.date');
// require('./js/lib/tempusdominus-bootstrap-4.min');

// chartJS
const moment = require('moment');
require('chart.js');
require('hammerjs');
require('./js/lib/chartjs-plugin-vh-line');
require('./js/lib/chartjs-plugin-zoom.js');

// select2
require('select2');

// custom code
require('./js/ChartConfig');
require('./js/ModuleChartDetail');
require('./js/ModuleChartOverview');
require('./js/ModalControllerDatapointForm');

// CSS
import './css/bootstrap-darkly.css';
import './less/style.less';
import './css/toast.css';
// import './css/tempusdominus-bootstrap-4.min.css';
import './css/pickadate/default.css';
import './css/pickadate/default.date.css';
// import './css/fontawesome-v5.8.1-solid.css';
// import './css/fontawesome-v5.8.1-fontawesome.css';
import '../node_modules/@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.css';

// assets
import './favicon.ico';
import "./img/touch-icon-iphone.png";
import "./img/touch-icon-ipad.png";
import "./img/touch-icon-iphone-retina.png";
import "./img/touch-icon-ipad-retina.png";
import "./img/dailytracklogo.png";
import "./img/dailytracklogolong.png";

// debug
window.moment = moment;

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
