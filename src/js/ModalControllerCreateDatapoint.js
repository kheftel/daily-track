/**
 * handles behavior for create datapoint modal. expects #create-datapoint to exist in page.
 */
ModalControllerCreateDatapoint = function () {
    this._selector = '#create-datapoint';

    // hook up submit button to form submission
    this.getView('#save').click(() => this.getView('-form').submit());

    // handle modal submission
    this.getView('-form').submit((e) => {
        // stop the form from submitting the normal way and refreshing the page
        e.preventDefault();

        // server-size validation, reset validation state
        this.getView('-form .form-control').removeClass('is-valid');
        this.getView('-form .form-control').removeClass('is-invalid');

        // disable submit button
        this.getView('#save').prop('disabled', true);

        // get the form data
        // there are many ways to get this data using jQuery (you can use the class or id also)
        var formData = {
            'x': this.getView('input[name=x]').val(),
            'y': this.getView('input[name=y]').val(),
        };

        // send data to server
        $.ajax({
                type: 'POST',
                url: this.getView('-form').attr('action'),
                data: formData,
                dataType: 'json',
                encode: true
            })
            .done((data) => {
                console.log('ajax response:');
                console.log(data);

                // enable save btn
                this.getView('#save').prop('disabled', false);

                if (!data.success) {
                    // validation error
                    if (data.errors) {
                        data.errors.forEach((error) => {
                            // add the error message
                            this.getView('-form #' + error.param).addClass('is-invalid');
                            this.getView('-form #' + error.param + '-invalid').html(error.msg);
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

                    this.getView().trigger('save', [this.getView().data('setid'), data.x, data.y]);

                    // hide modal
                    this.getView().modal('hide');

                    //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                    // usually after form submission, you'll want to redirect
                    // window.location = '/thank-you'; // redirect a user to another page
                }
            })
            .fail((data) => {
                // enable save btn
                this.getView('#save').prop('disabled', false);
                // this.getView('#save .spinner-border').addClass('d-none');

                // hide modal
                this.getView().modal('hide');

                $.toast({
                    title: 'Error!',
                    content: 'Unable to save, please try again later',
                    type: 'error',
                    delay: 5000
                });

                console.log('ajax error:');
                console.log(data);
            });
    });
};
var p = ModalControllerCreateDatapoint.prototype;

/**
 * returns the view, wrapped in a jQuery object
 */
p.getView = function (sub) {
    if (!sub) {
        this._modal = this._modal || $(this._selector);
        return this._modal;
    }
    return $(this._selector + (sub.charAt(0) == '-' ? '' : ' ') + sub);
};

/**
 * show the modal
 * 
 * @param {*} dataset required, the dataset to add a point to
 * @param {*} datapoint optional, if provided, indicates a datapoint to upate
 */
p.show = function (dataset, datapoint = null) {
    // set up modal data
    this.getView('#title').html((datapoint ? 'Edit entry for: ' : 'Track: ') + dataset.name);
    this.getView('#x').val(moment().format('YYYY-MM-DD'));
    this.getView('#x').prop('disabled', datapoint ? true : false);
    this.getView('#y').val(datapoint ? datapoint.y : '');
    this.getView('#y').attr('placeholder', dataset.yAxisLabel);
    this.getView('-form').attr('action', '/api/sets/' + dataset._id + '/data');
    this.getView().data('setid', dataset._id);

    // reset validation
    this.getView('.form-control').removeClass('is-valid');
    this.getView('.form-control').removeClass('is-invalid');

    // set all the valid feedback messages the same
    this.getView('.valid-feedback').html('OK');

    // show modal
    this.getView().modal('show');
};

module.exports = ModalControllerCreateDatapoint;