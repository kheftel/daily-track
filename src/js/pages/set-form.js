import '../../base.js';
import $ from 'jquery';

// are we in create or edit mode?
var id = $('#set-form')[0].dataset.setid;
console.log('set-form is in ' + (id !== undefined ? 'edit' : 'create') + ' mode');

// set all the valid feedback messages the same
$('.valid-feedback').html('OK');

$('#set-form').submit(function (event) {
    // check client-side validation
    //- var form = $('#set-form')[0];
    //- if (form.checkValidity() === false) {
    //-     event.preventDefault();
    //-     event.stopPropagation();
    //-     $('#set-form').addClass('was-validated');
    //-     $('.invalid-feedback').html('This field is required.');
    //-     return;
    //- }

    // server-size validation, reset validation state
    //- $('#set-form').removeClass('was-validated');
    //- $('#set-form').removeClass('needs-validation');
    $('.form-control').removeClass('is-valid');
    $('.form-control').removeClass('is-invalid');

    // disable btn
    $('#save').prop('disabled', true);

    // get the form data
    // there are many ways to get this data using jQuery (you can use the class or id also)
    var formData = {
        'name': $('input[name=name]').val(),
        'yAxisLabel': $('input[name=yAxisLabel]').val(),
        //- 'chartType':    $('select[name=chartType]').val(),
        'owner': $('input[name=owner]').val() // hidden
    };
    console.log(formData);

    // send data to server
    $.ajax({
            type: 'POST',
            url: (id !== undefined) ? ('/api/sets/' + id) : '/api/sets',
            data: formData,
            dataType: 'json',
            encode: true
        })
        .done(function (data) {
            console.log(data);

            // enable btn
            $('#save').prop('disabled', false);

            if (!data.success) {
                //- $('#set-form').addClass('was-validated');
                if (data.errors) {
                    data.errors.forEach(function (error) {
                        // add the error message
                        if (error.param) {
                            // validation error
                            $('#' + error.param).addClass('is-invalid');
                            $('#' + error.param + '-invalid').html(error.msg);
                        } else {
                            $.toast({
                                title: 'Error!',
                                content: error.msg || 'Unable to save, please try again later',
                                type: 'error',
                                delay: 5000
                            });
                        }
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
                setTimeout(() => window.location.href = '/', 500);

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
                content: 'Unable to save, please try again later',
                type: 'error',
                delay: 5000
            });

            // TO DO: show a user error
            console.log(data);
        });

    // stop the form from submitting the normal way and refreshing the page
    event.preventDefault();
});