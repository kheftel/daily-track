var $ = require('jquery');

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

        if (sidebarActive) {
            $('#sidebar').addClass('active');
            // $('#sidebar-shade').addClass('show');
            document.body.appendChild(sidebarbackdrop);
            $('#content').addClass('blur blur-md-none');
            $('body').addClass('sidebar-active');
        } else {
            $('#sidebar').removeClass('active');
            // $('#sidebar-shade').removeClass('show');
            document.body.removeChild(sidebarbackdrop);
            $('#content').removeClass('blur blur-md-none');
            $('body').removeClass('sidebar-active');
        }
    });
});