NewDatapointModalController = function () {
    this.modal = $('#new-datapoint');

    // hook up submit button to form submission
    $('#new-datapoint #save').click(() => $('#new-datapoint-form').submit());

    // handle modal submission
    $('#new-datapoint-form').submit(function (event) {
        // server-size validation, reset validation state
        $('#new-datapoint-form .form-control').removeClass('is-valid');
        $('#new-datapoint-form .form-control').removeClass('is-invalid');

        // disable submit button
        $('#new-datapoint #save').prop('disabled', true);

        // get the form data
        // there are many ways to get this data using jQuery (you can use the class or id also)
        var formData = {
            'x': $('input[name=x]').val(),
            'y': $('input[name=y]').val(),
        };

        // send data to server
        $.ajax({
                type: 'POST',
                url: $('#new-datapoint-form').attr('action'),
                data: formData,
                dataType: 'json',
                encode: true
            })
            .done(function (data) {
                console.log('ajax resopnse: ' + data);
                console.log(data);

                // enable save btn
                $('#new-datapoint #save').prop('disabled', false);

                if (!data.success) {
                    // validation error
                    if (data.errors) {
                        data.errors.forEach(function (error) {
                            // add the error message
                            $('#new-datapoint-form #' + error.param).addClass('is-invalid');
                            $('#new-datapoint-form #' + error.param + '-invalid').html(error.msg);
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

                    $('#new-datapoint').trigger('save', [$('#new-datapoint').data('setid')]);

                    // hide modal
                    $('#new-datapoint').modal('hide');

                    //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                    // usually after form submission, you'll want to redirect
                    // window.location = '/thank-you'; // redirect a user to another page
                }
            })
            .fail(function (data) {
                // enable save btn
                $('#new-datapoint #save').prop('disabled', false);
                // $('#new-datapoint #save .spinner-border').addClass('d-none');

                // hide modal
                $('#new-datapoint').modal('hide');

                $.toast({
                    title: 'Error!',
                    content: 'Unable to save, please try again later',
                    type: 'error',
                    delay: 5000
                });

                console.log('ajax error:');
                console.log(data);
            });

        // stop the form from submitting the normal way and refreshing the page
        event.preventDefault();
    });
};
var p = NewDatapointModalController.prototype;

p.show = function (title, setid, unit) {
    // set up modal data
    $('#new-datapoint #title').html(title);
    $('#new-datapoint #x').val(moment().format('YYYY-MM-DD'));
    $('#new-datapoint #y').val('');
    $('#new-datapoint #y').attr('placeholder', unit);
    $('#new-datapoint-form').attr('action', '/api/sets/' + setid + '/data');
    $('#new-datapoint').data('setid', setid);

    // reset validation
    $('#new-datapoint .form-control').removeClass('is-valid');
    $('#new-datapoint .form-control').removeClass('is-invalid');

    // set all the valid feedback messages the same
    $('#new-datapoint .valid-feedback').html('OK');

    // show modal
    $('#new-datapoint').modal('show');
};

module.exports = NewDatapointModalController;