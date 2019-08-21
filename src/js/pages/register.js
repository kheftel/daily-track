import '../../base.js';
import $ from 'jquery';

// set all the valid feedback messages the same
$('.valid-feedback').html('OK');

$('#register-form').submit(function (event) {
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
            url: '/api/register',
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

                // db saving error
                if (data.error) {
                    $.toast({
                        title: 'Error!',
                        content: data.error.message || 'Unable to save, please try again later',
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
                setTimeout(() => window.location.href = '/register/success', 500);

                //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                // usually after form submission, you'll want to redirect
                // window.location = '/thank-you'; // redirect a user to another page
            }
        })
        .fail(function (xhr) {
            // enable btn
            $('#save').prop('disabled', false);

            $.toast({
                title: 'Error!',
                content: (xhr && xhr.responseJSON && xhr.responseJSON.message) || 'Unable to save, please try again later',
                type: 'error',
                delay: 5000
            });

            // TO DO: show a user error
            console.log(xhr.responseJSON);
        });

    // stop the form from submitting the normal way and refreshing the page
    event.preventDefault();
});