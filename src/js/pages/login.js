import '../../base.js';
import $ from 'jquery';

// set all the valid feedback messages the same
$('.valid-feedback').html('OK');

$('#login-form').submit(function (event) {
    // server-size validation, reset validation state
    $('.form-control').removeClass('is-valid');
    $('.form-control').removeClass('is-invalid');

    // disable btn
    $('#save').prop('disabled', true);

    // get the form data
    // there are many ways to get this data using jQuery (you can use the class or id also)
    var formData = {
        'username': $('input[name=username]').val(),
        'password': $('input[name=password]').val(),
    };

    // send data to server
    $.ajax({
            type: 'POST',
            url: '/api/login',
            data: formData,
            dataType: 'json',
            encode: true
        })
        .done(function (data) {
            console.log(data);

            // enable btn
            $('#save').prop('disabled', false);

            if (!data.success) {
                // validation error
                if (data.errors) {
                    data.errors.forEach(function (error) {
                        // add the error message
                        $('#' + error.param).addClass('is-invalid');
                        $('#' + error.param + '-invalid').html(error.msg);
                    });
                }

                // db error
                if (data.error) {
                    $.toast({
                        title: 'Error!',
                        content: data.error.message || 'Database error, please try again later.',
                        type: 'error',
                        delay: 5000
                    });
                }

                // username/pw incorrect
                if(data.message) {
                    $.toast({
                        title: 'Error!',
                        content: data.message || 'Username or password incorrect.',
                        type: 'error',
                        delay: 5000
                    });
                }
            } else {
                // success
                $.toast({
                    title: 'Success!',
                    content: data.message,
                    type: 'success',
                    delay: 5000
                });

                // redirect to homepage with a timeout so you can see the message
                setTimeout(() => window.location.href = '/login/success', 500);

                //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                // usually after form submission, you'll want to redirect
                // window.location = '/thank-you'; // redirect a user to another page
            }
        })
        .fail(function (data) {
            // enable btn
            $('#save').prop('disabled', false);

            $.toast({
                title: 'Error!',
                content: 'Unable to log in, please try again later',
                type: 'error',
                delay: 5000
            });

            // TO DO: show a user error
            console.log(data);
        });

    // stop the form from submitting the normal way and refreshing the page
    event.preventDefault();
});