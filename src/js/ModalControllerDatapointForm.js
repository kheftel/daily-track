/**
 * handles behavior for create datapoint modal. expects /views/modals/datapoint-form to exist in page.
 */
ModalControllerDatapointForm = function () {
    this._selector = '#modal-datapoint';

    /**
     * 
     * @param {*} e event
     * @param {*} btn '#save' or '#delete'
     */
    var submitForm = (e, btn) => {
        // stop the form from submitting the normal way and refreshing the page
        // e.preventDefault();

        // server-size validation, reset validation state
        this.getView('-form .form-control').removeClass('is-valid');
        this.getView('-form .form-control').removeClass('is-invalid');

        // disable submit button
        this.getView(btn).prop('disabled', true);

        // get the form data
        // there are many ways to get this data using jQuery (you can use the class or id also)
        var formData = {
            'x': this.getView('input[name=x]').val(),
            'y': this.getView('input[name=y]').val(),
        };
        if (btn == '#delete')
            formData.delete = 1;

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

                // enable submit btn
                this.getView(btn).prop('disabled', false);

                if (!data.success) {
                    // validation error
                    if (data.errors) {
                        data.errors.forEach((error) => {
                            // add the error message
                            if (error.param) {
                                // validation error
                                this.getView('-form #' + error.param).addClass('is-invalid');
                                this.getView('-form #' + error.param + '-invalid').html(error.msg);
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

                    if (btn == '#save')
                        this.getView().trigger('saved', [this.getView().data('setid'), data.datapoint]);
                    else if (btn == '#delete')
                        this.getView().trigger('deleted', [this.getView().data('setid'), data.datapoint]);

                    // hide modal
                    this.getView().modal('hide');

                    //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                    // usually after form submission, you'll want to redirect
                    // window.location = '/thank-you'; // redirect a user to another page
                }
            })
            .fail((data) => {
                // enable save btn
                this.getView(btn).prop('disabled', false);
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
    };

    // submit behaviors

    // if enter pressed, click save btn
    this.getView('-form').submit((e) => {
        e.preventDefault();
        this.getView('#save').click();
    });

    // click save button, submit form via ajax
    this.getView('#save').click((e) => submitForm(e, '#save'));

    this.getView('#delete').confirmation({
        rootSelector: this.getView('#delete'),
        popout: true,
        container: this.getView(),
        title: 'Are you sure you want to delete this value?',
        btnOkLabel: 'Yes, Delete it',
        btnOkClass: 'btn btn-danger',
        btnOkIconClass: 'fas fa-trash-alt mr-1',
        btnCancelLabel: 'Cancel',
        btnCancelClass: 'btn btn-outline-dark'
    }).on('click', (e) => {
        submitForm(e, '#delete');
    });
};
var p = ModalControllerDatapointForm.prototype;

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
    this.getView('#x').val(datapoint ? datapoint.x : moment().format('YYYY-MM-DD'));
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

    // manage button visibility
    if (datapoint) {
        this.getView('#save').removeClass('d-none');
        this.getView('#delete').removeClass('d-none');
    } else {
        this.getView('#save').removeClass('d-none');
        this.getView('#delete').addClass('d-none');
    }

    // show modal
    this.getView().modal('show');
};

module.exports = ModalControllerDatapointForm;