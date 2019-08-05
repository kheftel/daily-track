/**
 * Dataset detail view, wraps a ChartJS chart
 * 
 * @param  {} container the html element (or id of an element) that will contain this module
 */
var _numControllers = 0;
ModuleChartDetail = function (container, datapointModal) {
    if (typeof container == 'string')
        container = document.getElementById(container);

    if (!container)
        throw new Error('chart: container not found');

    // grab data from the container
    this._container = container;
    this._containerData = container.dataset;

    if (datapointModal) {
        this._datapointModal = datapointModal;
        this._datapointModal.getView().on('saved', (event, setid, datapoint) => {
            if (!this.datasets) return;
            for (let i = 0; i < this.datasets.length; i++) {
                if (setid == this.datasets[i]._id) {
                    console.log('saved');
                    console.log(datapoint);
                    this.setDatasetPoint(datapoint.x, datapoint, i);
                    this.updateTagCloud();
                    this._chart.update();
                    break;
                }
            }
        });
        this._datapointModal.getView().on('deleted', (event, setid, datapoint) => {
            if (!this.datasets) return;
            for (let i = 0; i < this.datasets.length; i++) {
                if (setid == this.datasets[i]._id) {
                    console.log('deleted');
                    console.log(datapoint);
                    this.deleteDatasetValue(datapoint.x, i);
                    this.updateTagCloud();
                    this._chart.update();
                    break;
                }
            }
        });
    }

    this._focus = moment.utc().startOf('day');

    // create html
    // .card.border-light.shadow-rb(style="height: " + style.chartRowHeight)
    //     .card-header.p-2
    //         .card-title.m-0.d-flex.content-justify-between
    //             h4.m-0.text-shadow
    //                 a.align-middle(href="/set/" + set._id)= set.name
    //             button.ml-auto.btn.btn-primary.btn-shadow
    //                 span.fas.fa-edit
    //     .card-body(style="position: relative;")
    //         .chartcontainer(id="set-" + i + "-" + set._id data-setid=set._id)

    this._main = elem(
        'div',
        this._container,
        ['card', 'border-light', 'shadow-rb', 'd-flex', 'flex-column', 'flex-expand'],
        ''
    );
    this._cardHeader = elem('div', this._main, ['card-header', 'd-flex', 'align-items-center', 'p-1']);
    this._setLabel = elem('h5', this._cardHeader, ['align-middle', 'm-0'], null, this._containerData.setname || '&nbsp;');

    this._btnAdd = iconButton(['ml-auto', 'btn-shadow', 'd-none'], this._cardHeader, 'fa-plus', () => {
        if (this._datapointModal)
            this._datapointModal.show(this.datasets[0]);
    });

    this._drpHeader = elem('div', this._cardHeader, ['dropdown']);
    this._drpHeaderBtn = elem('button', this._drpHeader, ['btn', 'btn-primary', 'btn-shadow', 'dropdown-toggle', 'd-none']);
    $(this._drpHeaderBtn)
        .attr('type', 'button')
        .attr('id', 'dropdown' + _numControllers)
        .attr('data-toggle', 'dropdown');
    this._drpHeaderBody = elem('div', this._drpHeader, ['dropdown-menu', 'dropdown-menu-right']);
    /* <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        Dropdown button
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        <a class="dropdown-item" href="#">Action</a>
        <a class="dropdown-item" href="#">Another action</a>
        <a class="dropdown-item" href="#">Something else here</a>
      </div>
    </div> */

    this._editButton = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-edit', 'Edit');
    //iconButton(['ml-auto', 'dropdown-item'], this._drpHeaderBody, 'fa-edit');
    this._toggleHTML = {
        'bar': '<span class="fas fa-chart-line"></span><span class="ml-2">Switch to line Chart</span>',
        'line': '<span class="fas fa-chart-bar"></span><span class="ml-2">Switch to bar Chart</span>'
    };
    this._btnType = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, '', '', '#', (e) => {
        e.preventDefault();
        if (this.datasets.length == 1) {
            var set = this.datasets[0];
            if (set.type == 'line') {
                set.type = 'bar';
                this._btnType.innerHTML = this._toggleHTML.bar;
            } else {
                set.type = 'line';
                this._btnType.innerHTML = this._toggleHTML.line;
            }

            this.updateChart();
        }
    });
    this._deleteButton = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-trash-alt', 'Delete', '#');

    this._cardBody = elem('div', this._main, ['card-body', 'p-1', 'd-flex', 'flex-column', 'flex-expand'], '');
    this._contentContainer = elem('div', this._cardBody, ['d-none', 'p-0', 'text-center', 'flex-expand', 'align-items-center'], 'position: relative; opacity: 0; transition: opacity 0.5s;');
    this._spinner = elem('span', this._cardBody, ['spinner-border', 'spinner-border-sm']);
    this._rangeLabel = elem('h6', this._contentContainer, ['align-middle', 'text-center', 'm-0']);

    var chartHeight = 250;

    // holds the canvas for the chart
    this._canvasholder = elem(
        'div',
        this._contentContainer,
        ['w-100'],
        'height: ' + chartHeight + 'px; position: relative;'
    );

    // canvas the chart is rendered on
    this._canvas = elem('canvas', this._canvasholder);

    this._buttonRow = elem('div', this._contentContainer, ['btn-group', 'm-0']);
    this._buttons = {};
    Object.keys(ChartConfig.zoomData).forEach((k) => {
        var data = ChartConfig.zoomData[k];
        var btn = elem('button', this._buttonRow, ['btn', 'btn-primary', 'p-1', 'font-80'], null, data.label);
        btn.id = k;
        this._buttons[k] = btn;
        $(btn).click(() => {
            this.newZoom(k);
        });
    });

    // tag cloud
    this._tagCloudHolder = elem('div',
        this._contentContainer,
        ['bg-gray-900', 'border', 'border-secondary', 'd-flex', 'flex-expand', 'flex-wrap', 'align-items-center', 'align-content-start', 'p-2', 'rounded-2', 'w-100'],
        'position: absolute;height: calc(100% - ' + chartHeight + 'px - 42px - .5rem); bottom: 0;');
    this._tagCloudHolder.id = 'tag-cloud';

    // footer with buttons to manipulate chart
    this._footer = elem('div', this._contentContainer, ['controlbar', 'shadow-rb'], `max-width: 300px; margin: 0 auto; border-radius: 1rem; border: ${this.defaultFocusStyle.borderWidth}px solid ${this.defaultFocusStyle.borderColor}; height: 84px; background: #383838;`);
    $(this._footer).addClass('d-none'); // hidden for now
    this._row1 = elem('div', this._footer, ['d-flex', 'justify-content-center', 'align-items-center', 'pt-1']);
    this._row2 = elem('div', this._footer, ['d-flex', 'form-inline', 'justify-content-center', 'align-items-center', 'pt-1']);

    this._btnZoomOut = iconButton([], this._row1, 'fa-search-minus', (e) => {
        e.preventDefault();
        this.zoomOut();
    });

    this._btnLeft = iconButton([], this._row1, 'fa-angle-double-left', () => {
        this.panLeft();
    });

    var datefocusid = 'focusdatepicker' + _numControllers;

    //<input type="text" class="form-control datetimepicker-input" id="datetimepicker5" data-toggle="datetimepicker" data-target="#datetimepicker5"/>

    // create datepicker component
    this._dateDisplay = elem('input', this._row1, ['form-control'], 'max-width: 8rem;');
    $(this._dateDisplay).attr('data-value', this._focus.format('YYYY-MM-DD'));
    $(this._dateDisplay).attr('value', this._focus.format('YYYY-MM-DD'));
    this._dateDisplay.id = datefocusid;

    this._pickadate = $(this._dateDisplay).pickadate({
        formatSubmit: 'YYYY-MM-DD',
        format: 'yyyy-mm-dd'
    }).pickadate('picker');
    this._pickadate.on({
        set: (value) => {
            var newFocus = moment(value.select);
            if (this._focus.format('YYYY-MM-DD') == newFocus.format('YYYY-MM-DD')) {
                return;
            }
            console.log('pickadate set value: ', newFocus.format());
            this._focus = newFocus;
            this.updateChart();
        }
    });

    // this._dateDisplay = elem('input', this._row1, ['form-control', 'datetimepicker-input'], 'max-width: 8rem;');
    // this._dateDisplay.id = datefocusid;
    // $(this._dateDisplay)
    //     .attr('data-toggle', 'datetimepicker')
    //     .attr('data-target', '#' + datefocusid)
    //     .datetimepicker({
    //         format: 'L'
    //     });
    // set date picker value
    //$(this._dateDisplay).datetimepicker('date', this._focus);
    // adjust chart when date picker changes
    // $(this._dateDisplay).on('change.datetimepicker', (e) => {
    //     var newFocus = moment(e.date).utc().startOf('day');
    //     if(this._focus.format('YYYY-MM-DD') == newFocus.format('YYYY-MM-DD')) {
    //         return;
    //     }

    //     console.log('date picker changed: ' + newFocus.format());
    //     this._focus = newFocus;
    //     this.updateChart();
    // });

    this._btnRight = iconButton([], this._row1, 'fa-angle-double-right', () => {
        this.panRight();
    });
    this._btnZoomIn = iconButton([], this._row1, 'fa-search-plus', (e) => {
        e.preventDefault();
        this.zoomIn();
    });

    this._formgroupValue = elem('div', this._row2, ['input-group']);
    // this._btnAdd = iconLinkButton([, 'd-none'], this._row2, 'fa-plus-square');
    var inputId = 'focusinputvalue' + _numControllers;
    // this._inputValueLabel = elem('label', this._row2, [], 'margin:0; padding: 0.25rem;');
    // $(this._inputValueLabel).attr('id', inputId);
    this._inputValue = elem('input', this._formgroupValue, ['form-control'], 'max-width: 6rem;');
    this._inputValue.id = inputId;
    this._inputValue.type = 'number';
    // save when user presses enter
    $(this._inputValue).on("keyup", (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            this._btnSaveValue.click();
        }
    });
    // input addon
    this._addonValue = elem('div', this._formgroupValue, ['input-group-append']);
    this._addonValueLabel = elem('span', this._addonValue, ['input-group-text'], null);

    this._btnSaveValue = iconButton([], this._row2, 'fa-save'); // elem('button', this._row2, [], null, 'Save');
    var btnSaveValueSpinner = elem('span', this._btnSaveValue, ['spinner-border', 'spinner-border-sm', 'ml-1']);
    this._btnDeleteValue = iconButton([], this._row2, 'fa-trash-alt');
    var btnDeleteValueSpinner = elem('span', this._btnDeleteValue, ['spinner-border', 'spinner-border-sm', 'ml-1']);

    this._colorOffset = 0;
    this._colorScheme = this.defaultColorScheme;

    // create chart
    var config = JSON.parse(JSON.stringify(ModuleChartDetail.prototype.defaultConfig));
    config.options.plugins.zoom.pan.onPan = ({
        chart
    }) => {
        this.updateRangeLabel();
    };
    config.options.plugins.zoom.pan.onPanComplete = ({
        chart
    }) => {
        this.updateTagCloud();
    };
    config.options.onClick = (e, arr) => {
        console.log(arr);
        if (!Array.isArray(arr) || arr.length == 0 || arr.length > 1) return; // only support single datasets for now

        if (!this._datapointModal) return;

        var p = arr[0];
        if (p == null || p._datasetIndex == null || p._index == null) return;
        var datapoint = this.datasets[p._datasetIndex].data[p._index];

        this._datapointModal.show(this.datasets[p._datasetIndex], datapoint);

        // var newFocus = moment(datapoint.x).utc().startOf('day');
        // console.log('clicked datapoint, focusing on: ' + newFocus.format());
        // this._focus = newFocus;
        // this.updateChart();
    };

    // config.options.verticalLine = [{
    //     x: this._focus.format('YYYY-MM-DD'),
    //     borderColor: this.defaultFocusStyle.borderColor,
    //     borderWidth: this.defaultFocusStyle.borderWidth
    // }];

    this._chart = new Chart(this._canvas, config);
    this._datasetIds = [];

    // this.setZoomLevel(this.defaultZoomLevel, false);
    this.newZoom('week');

    this._id = _numControllers;
    _numControllers++;

    // set dataset
    if (this._containerData.setid)
        this.addDataset(this._containerData.setid);

};
var p = ModuleChartDetail.prototype;

ModuleChartDetail.prototype.newZoom = function (level) {

    var data = ChartConfig.zoomData[level];

    this._chart.options.scales.xAxes[0].time.unit = data.unit;
    this._chart.options.scales.xAxes[0].time.min = moment(ChartConfig.today).add(data.viewport).format('YYYY-MM-DD');
    this._chart.options.scales.xAxes[0].time.max = ChartConfig.today.format('YYYY-MM-DD');
    this._chart.data.labels = data.labels;

    this._chart.update();

    this.updateRangeLabel();
    this.updateTagCloud();
};

ModuleChartDetail.prototype.updateRangeLabel = function () {
    this._rangeLabel.innerHTML = this.getRangeString();
};

// some defaults
ModuleChartDetail.prototype.dateFormat = 'MM/DD/YYYY';

ModuleChartDetail.prototype.defaultZoomLevel = 6;

ModuleChartDetail.prototype.defaultButtonClasses = ['btn', 'btn-primary'];

ModuleChartDetail.prototype.defaultFocusStyle = {
    borderColor: '#00bc8c', //'#375a7f',
    borderWidth: 3
};

// convenience functions ////////////////////////

/**
 * create an html element
 * 
 * @param  {} type required, which element to create
 * @param  {} parent optional, where to attach in DOM
 * @param  {} classList optional, array of classes to add (or one single class as a string)
 * @param  {} style optional, inline css to add
 * @param  {} innerHTML optional, innerHTML to add
 */
function elem(type, parent, classList, style, innerHTML) {
    var result = document.createElement(type);
    if (classList) {
        result.classList.add.apply(result.classList, Array.isArray(classList) ? classList : [classList]);
    }
    if (style) {
        result.style = style;
    }
    if (innerHTML) {
        result.innerHTML = innerHTML;
    }
    if (parent) {
        parent.appendChild(result);
    }
    return result;
}
/**
 * create a button with an icon
 * 
 * @param  {Array} classList
 * @param  {} parent
 * @param  {} icon
 * @param  {} click
 * @param  {} style
 */
function iconButton(classList, parent, icon, click, style) {
    var result = elem('button', parent, ModuleChartDetail.prototype.defaultButtonClasses.concat(classList), style, `<span class="fas ${icon}"></i>`);
    if (click)
        $(result).click(click);
    return result;
}

/**
 * create a link with an icon and text
 * @param {*} classList 
 * @param {*} parent 
 * @param {*} icon 
 * @param {*} text 
 * @param {*} href 
 * @param {*} click 
 * @param {*} style 
 */
function iconLink(classList, parent, icon, text, href, click, style) {
    var result = elem('a', parent, classList, style, `<span class="fas ${icon}"></span><span class="ml-2">${text}</span>`);
    if (href)
        result.href = href;
    if (click)
        $(result).click(click);
    return result;
}

// function showmodal(message) {
//     var modal = elem('div', body, ['modal', 'fade']);

//     modal.innerHTML =
//         `<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
//       <div class="modal-dialog" role="document">
//         <div class="modal-content">
//           <div class="modal-header">
//             <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
//             <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//               <span aria-hidden="true">&times;</span>
//             </button>
//           </div>
//           <div class="modal-body">
//             ${message}
//           </div>
//           <div class="modal-footer">
//             <button type="button" class="btn btn-secondary" data-dismiss="modal">No</button>
//             <button type="button" class="btn btn-primary">Yes</button>
//           </div>
//         </div>
//       </div>
//     </div>`;

//     $(modal).show();
// }

/**
 * add a dataset to the chart, it will populate itself via AJAX
 * 
 * @param  {} id
 * @param  {} complete
 */
ModuleChartDetail.prototype.addDataset = function (id, complete) {
    $.ajax({
        url: '/api/sets/' + id,
        method: 'GET',
        success: (dataset) => {
            this.addDatasetFromModel(dataset, complete);
        },
        error: (err) => {
            console.log(err);

            if (complete) complete();
        }
    });
};

/**
 * add several datsets at once
 * 
 * @param  {} ids array of dataset ids
 */
ModuleChartDetail.prototype.addDatasetsFromIds = function (ids) {
    var which = 0;
    var datasets = [];

    function load(id) {
        console.log('loading set ' + id);
        $.ajax({
            url: '/api/sets/' + id,
            method: 'GET',
            success: (dataset) => {
                datasets.push(dataset);
                next();
            },
            error: (err) => {
                console.log(err);
                next();
            }
        });
    }

    var next = function () {
        console.log(which + '/' + ids.length);
        if (which < ids.length) {
            load(ids[which]);
            which++;
        } else if (which == ids.length) {
            // all done
            datasets.forEach((set, i) => {
                console.log('adding set ' + i + ', id=' + set._id);
                this.addDatasetFromModel(set);
            });

            // redundant
            // this._chart.update();
        }
    }.bind(this);

    next();
};
/**
 * add a dataset from the complete data
 * 
 * @param  {} dataset
 * @param  {} complete
 */
ModuleChartDetail.prototype.addDatasetFromModel = function (dataset, complete) {
    // translate for chart dataset object
    dataset.type = dataset.chartType;
    dataset.label = dataset.name;
    if (this.datasets >= 1) dataset.label += ' (' + dataset.yAxisLabel + ')';
    dataset.data = dataset.data;
    dataset.fill = false;
    dataset.pointBackgroundColor = this.getColor(this.datasets.length);
    dataset.pointBorderColor = this.getColor(this.datasets.length);
    dataset.borderColor = this.getColor(this.datasets.length);
    dataset.backgroundColor = Chart.helpers.color(this.getColor(this.datasets.length)).alpha(0.6).rgbString();

    // don't trigger a chart update yet
    // TO DO: what if different charts have different y axis labels?
    this.xAxis.scaleLabel.labelString = dataset.xAxisLabel;
    this.yAxis.scaleLabel.labelString = dataset.yAxisLabel;

    this.datasets.push(dataset);
    this._datasetIds.push(dataset._id);

    // disable some buttons if in multi-mode
    if (this.datasets.length > 1) {
        $(this._btnType).addClass('d-none');
        $(this._btnAdd).addClass('d-none');
        $(this._drpHeaderBtn).addClass('d-none');
        $(this._row2).removeClass('d-flex').addClass('d-none');
        $(this._deleteButton).addClass('d-none');
        $(this._editButton).addClass('d-none');

        $(this._setLabel).html(dataset.yAxisLabel);

        // turn on legend display
        this._chart.options.legend.display = true;

        // this._chart.options.tooltips.mode = 'x';
        // this._chart.options.tooltips.intersect = true;
        // this._chart.options.elements.point.hoverRadius = 5;
    } else {
        // set the header text
        $(this._setLabel).html(dataset.name + ' (' + dataset.yAxisLabel + ')');

        // show dropdown
        $(this._drpHeaderBtn).removeClass('d-none');

        // show type toggle btn
        // $(this._btnType).removeClass('d-none').html(this._toggleHTML[dataset.type]);

        // $(this._btnAdd).removeClass('d-none').attr('href', '/set/' + dataset._id + '/new');
        $(this._btnAdd).removeClass('d-none');

        // show / activate edit button
        $(this._editButton).removeClass('d-none').attr('href', '/set/' + dataset._id + '/edit');

        // show row 2
        $(this._row2).addClass('d-flex').removeClass('d-none');

        // activate save button
        // $(this._inputValueLabel).html(dataset.yAxisLabel + ':');
        $(this._addonValueLabel).html(dataset.yAxisLabel);
        $(this._btnSaveValue).on('click', () => {

            // disable btn
            $(this._btnSaveValue).prop('disabled', true);

            // get the form data
            var formData = {
                'x': this._focus.format('YYYY-MM-DD'),
                'y': $(this._inputValue).val()
            };

            // send data to server
            $.ajax({
                    type: 'POST',
                    url: '/api/sets/' + dataset._id + '/data',
                    data: formData,
                    dataType: 'json',
                    encode: true
                })
                .done((data) => {
                    console.log('ajax resopnse:');
                    console.log(data);

                    // enable btn
                    $(this._btnSaveValue).prop('disabled', false);

                    if (!data.success) {
                        // validation error
                        if (data.errors) {
                            data.errors.forEach((error) => {
                                // add the error message

                                $.toast({
                                    title: 'Error',
                                    content: error.msg,
                                    type: 'error',
                                    delay: 5000
                                });
                            });
                        }
                    } else {
                        // success

                        // add data point to dataset
                        this.setDatasetValue(formData.x, formData.y);
                        this.updateChart();

                        $.toast({
                            title: 'Success!',
                            content: data.message,
                            type: 'success',
                            delay: 5000
                        });

                        //- $('form').append('<div class="alert alert-success">' + data.message + '</div>');

                        // usually after form submission, you'll want to redirect
                        // window.location = '/thank-you'; // redirect a user to another page
                    }
                })
                .fail((data) => {
                    // enable btn
                    $(this._btnSaveValue).prop('disabled', false);

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

        // activate delete value button
        $(this._btnDeleteValue)
            .confirmation({
                rootSelector: this._btnDeleteValue,
                popout: true,
                container: 'body',
                title: 'Are you sure you want to delete this value?'
            }).on('click', () => {

                // disable btn
                $(this._btnDeleteValue).prop('disabled', true);

                // get the form data
                // TO DO: y should be not required if delete is passed
                var formData = {
                    'x': this._focus.format('YYYY-MM-DD'),
                    'y': $(this._inputValue).val(),
                    'delete': '1'
                };

                // TO DO: update disabled value as you scroll the chart
                //var pointExists = this.getDatasetValueExists(formData.x);

                // send data to server
                $.ajax({
                        type: 'POST',
                        url: '/api/sets/' + dataset._id + '/data',
                        data: formData,
                        dataType: 'json',
                        encode: true
                    })
                    .done((data) => {
                        console.log('ajax resopnse:');
                        console.log(data);

                        // enable btn
                        $(this._btnDeleteValue).prop('disabled', false);

                        if (!data.success) {
                            // error in deletion
                            if (data.errors) {
                                data.errors.forEach((error) => {
                                    // add the error message

                                    $.toast({
                                        title: 'Error',
                                        content: error.msg,
                                        type: 'error',
                                        delay: 5000
                                    });
                                });
                            }
                        } else {
                            // success, datapoint deleted
                            this.deleteDatasetValue(formData.x);
                            this.updateChart();

                            $.toast({
                                title: 'Success!',
                                content: data.message,
                                type: 'success',
                                delay: 5000
                            });
                        }
                    })
                    .fail((data) => {
                        // enable btn
                        $(this._btnDeleteValue).prop('disabled', false);

                        $.toast({
                            title: 'Error!',
                            content: 'Unable to delete, please try again later',
                            type: 'error',
                            delay: 5000
                        });

                        console.log('ajax error:');
                        console.log(data);
                    });

            });

        // show and activate delete button
        $(this._deleteButton).removeClass('d-none').confirmation({
            rootSelector: this._deleteButton,
            popout: true,
            container: 'body',
            title: 'Are you sure you want to delete ' + dataset.name + '?'
        }).on('click', (e) => {
            if (this.datasets.length != 1) throw new Error('cannot delete if empty or in multi-mode');

            e.preventDefault();

            // delete set from database
            $.ajax({
                    url: '/api/sets/' + dataset._id,
                    method: 'POST',
                    data: {
                        name: dataset.name,
                        yAxisLabel: dataset.yAxisLabel,
                        delete: '1'
                    },
                    dataType: 'json',
                    encode: true
                })
                .done((data) => {
                    console.log('ajax resopnse:');
                    console.log(data);

                    // enable btn
                    $(this._deleteButton).prop('disabled', false);

                    if (!data.success) {
                        // error in deletion
                        if (data.errors) {
                            data.errors.forEach((error) => {
                                // add the error message

                                $.toast({
                                    title: 'Error',
                                    content: error.msg,
                                    type: 'error',
                                    delay: 5000
                                });
                            });
                        }
                    } else {
                        $(this._main)
                            .removeClass('anim-disappear')
                            .addClass('anim-disappear')
                            .on('animationend webkitanimationEnd', (e) => {
                                // destroy chart and html
                                this._chart.destroy();
                                this._chart = null;
                                this._main.remove();

                                $.toast({
                                    title: 'Success!',
                                    content: data.message,
                                    type: 'success',
                                    delay: 5000
                                });

                                // if we were on the set detail page, we should go somewhere else
                                if (window.location.pathname != '/')
                                    window.location.href = '/';
                            });
                    }
                })
                .fail((data) => {
                    // enable btn
                    $(this._deleteButton).prop('disabled', false);

                    $.toast({
                        title: 'Error!',
                        content: 'Unable to delete, please try again later',
                        type: 'error',
                        delay: 5000
                    });
                    console.log('ajax error:');
                    console.log(data);
                });
        });
    }

    console.log('dataset added:');
    console.log(dataset);

    // console.log('scaleservice time defaults:');
    // console.log(Chart.scaleService.defaults.time);

    // update chart
    // this.updateChart();
    this._chart.update();
    this.updateTagCloud();

    $(this._contentContainer).removeClass('d-none');
    this._contentContainer.style.opacity = 1;
    $(this._spinner).addClass('d-none');

    if (complete) complete();
};

/**
 *  datasets (readonly) 
 **/
Object.defineProperty(p, 'datasets', {
    get() {
        return this._chart.data.datasets;
    }
});

// COLORS //////////
var chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

ModuleChartDetail.prototype.colorSchemes = {
    vividRainbow: ['#00AAEE', '#A6D608', '#FFE302', '#FF5F00', '#F70D1A', '#9F00FF'],
    darkly: ["#3498DB", "#00bc8c", "#ffef00", "#F39C12", "#fd7e14", "#E74C3C", "#e83e8c", "#6f42c1", "#6610f2", "#375a7f"],
    chartjs: [chartColors.red, chartColors.orange, chartColors.yellow, chartColors.green, chartColors.blue, chartColors.purple, chartColors.grey]
};

ModuleChartDetail.prototype.defaultColorScheme = 'darkly';

/** color scheme names (readonly) */
Object.defineProperty(p, 'schemeNames', {
    get() {
        return Object.keys(ModuleChartDetail.prototype.colorSchemes);
    }
});

/** get/set color scheme. does NOT update chart, you must do that manually */
Object.defineProperty(p, 'colorScheme', {
    get() {
        return this._colorScheme;
    },
    set(value) {
        if (ModuleChartDetail.prototype.schemeNames.indexOf(value) == -1)
            throw new Error('schemeName must be one of: ' + ModuleChartDetail.prototype.schemeNames.toString());

        this._colorScheme = value;
        this._colorOffset = 0;
        this.refreshColorsFromScheme();
    }
});

/**
 * apply color scheme to chart options.
 */
ModuleChartDetail.prototype.refreshColorsFromScheme = function () {
    for (var i = 0; i < this.datasets.length; i++) {
        var set = this.datasets[i];
        set.pointBackgroundColor = this.getColor(i);
        set.pointBorderColor = this.getColor(i);
        set.borderColor = this.getColor(i);
    }
};

/** get/set colorOffset within the color scheme. does NOT update chart, you must do that manually */
Object.defineProperty(p, 'colorOffset', {
    get() {
        return this._colorOffset;
    },
    set(i) {
        this._colorOffset = i;

        this.refreshColorsFromScheme();
    }
});
/**
 * grab a color from the colorscheme
 * 
 * @param  {} i=0
 */
ModuleChartDetail.prototype.getColor = function (i = 0) {
    var scheme = this.colorSchemes[this._colorScheme];
    return scheme[(i + this._colorOffset) % scheme.length];
};

/*ModuleChartDetail.prototype.setColorScheme = function(scheme) {
    this._colorScheme = scheme;

    this._chart.data.datasets.foreach(function(v, i, a) {
        v.
    });

    pointBackgroundColor: window.chartColors.orange,
    pointBorderColor: window.chartColors.orange,
    borderColor: Color(window.chartColors.orange)

}*/

// ZOOMING and PANNING //////////
ModuleChartDetail.prototype.timeScales = [{
        label: '1 year',
        zoom: {
            'years': 1
        },
        half: {
            'months': 6
        },
        pan: {
            'months': 1
        },
        unit: 'month'
    },
    {
        label: '6 months',
        zoom: {
            'months': 6
        },
        half: {
            'months': 3
        },
        pan: {
            'months': 1
        },
        unit: 'month'
    },
    {
        label: '3 months',
        zoom: {
            'months': 3
        },
        half: {
            'weeks': 6
        },
        pan: {
            'weeks': 2
        },
        unit: 'week'
    },
    {
        label: '2 months',
        zoom: {
            'months': 2
        },
        half: {
            'months': 1
        },
        pan: {
            'weeks': 1
        },
        unit: 'week'
    },
    {
        label: '1 month',
        zoom: {
            'months': 1
        },
        half: {
            'weeks': 2
        },
        pan: {
            'weeks': 1
        },
        unit: 'week'
    },
    {
        label: '2 weeks',
        zoom: {
            'weeks': 2
        },
        half: {
            'weeks': 1
        },
        pan: {
            'days': 1
        },
        unit: 'day'
    },
    {
        label: '1 week',
        zoom: {
            'weeks': 1
        },
        half: [{
            'hours': 3 * 24
        }, {
            'hours': 3 * 24 + 12
        }],
        pan: {
            'days': 1
        },
        unit: 'day'
    }
];

/** xAxis config object from chart (readonly) */
Object.defineProperty(p, 'xAxis', {
    get() {
        return this._chart.options.scales.xAxes[0];
    }
});

/** xAxisLabel from chart. does NOT update chart, you must do that manually */
Object.defineProperty(p, 'xAxisLabel', {
    get() {
        return this.xAxis.scaleLabel.labelString;
    },
    set(val) {
        this.xAxis.scaleLabel.labelString = val;
    }
});

/** yAxis config object from chart (readonly) */
Object.defineProperty(p, 'yAxis', {
    get() {
        return this._chart.options.scales.yAxes[0];
    }
});

/** yAxisLabel from chart. does NOT update chart, you must do that manually */
Object.defineProperty(p, 'yAxisLabel', {
    get() {
        return this.yAxis.scaleLabel.labelString;
    },
    set(val) {
        this.yAxis.scaleLabel.labelString = val;
    }
});
/**
 * set zoom level of chart
 * 
 * @param  {} val zoom level
 * @param  {} update=true whether to update chart
 */
ModuleChartDetail.prototype.setZoomLevel = function (val, update = true) {
    if (val < 0 || val >= this.timeScales.length) {
        $.toast({
            title: 'Info',
            content: 'Min/max zoom level reached',
            type: 'info',
            delay: 5000
        });
    }

    val = Math.max(0, Math.min(val, this.timeScales.length - 1));
    this._zoomLevel = val;
    // console.log('zoom level: ' + this._zoomLevel);

    if (update)
        this.updateChart();
};

/**
 * current zoom level
 */
ModuleChartDetail.prototype.getZoomLevel = function () {
    return this._zoomLevel;
};

/**
 * zoom in one level
 * 
 * @param  {} update=true
 */
ModuleChartDetail.prototype.zoomIn = function (update = true) {
    this.setZoomLevel(this._zoomLevel + 1, update);
};
/**
 * zoom out one level
 * 
 * @param  {} update=true
 */
ModuleChartDetail.prototype.zoomOut = function (update = true) {
    this.setZoomLevel(this._zoomLevel - 1, update);
};

/** 
 * current timeScale object for this zoom level (readonly) 
 */
Object.defineProperty(p, 'timeScale', {
    get() {
        return this.timeScales[this._zoomLevel];
    }
});

/**
 * where the chart is centered, formatted string
 */
ModuleChartDetail.prototype.getFocus = function () {
    return this._focus.format('YYYY-MM-DD');
};

/**
 * pan to the right one unit based on timescale
 * 
 * @param  {} update=true
 */
ModuleChartDetail.prototype.panRight = function (update = true) {
    // this._focus.add(this.pans[this._zoomLevel]);
    this._focus.add(this.timeScale.pan);
    if (update)
        this.updateChart();
};

/**
 * pan to the left one unit based on timescale
 * 
 * @param  {} update=true
 */
ModuleChartDetail.prototype.panLeft = function (update = true) {
    // this._focus.subtract(this.pans[this._zoomLevel]);
    this._focus.subtract(this.timeScale.pan);
    if (update)
        this.updateChart();
};

/**
 * show alllllll the data for this set
 * 
 * @param  {} update=true
 */
ModuleChartDetail.prototype.showAll = function (update = true) {
    var data = this._chart.data.datasets[0].data;
    var first = data[0].x;
    var last = data[data.length - 1].x;
    this._chart.options.scales.xAxes[0].time.min = first;
    this._chart.options.scales.xAxes[0].time.max = last;
    if (update)
        this._chart.update();
};

/**
 * labeling string representing the range of the chart
 * 
 * @param {*} scaleid which scale to use, defaults to the first horizontal one
 */
ModuleChartDetail.prototype.getRangeString = function (scaleid = 'x-axis-0') {
    var min = moment(this._chart.scales[scaleid].min);
    var max = moment(this._chart.scales[scaleid].max);
    var minYear = min.format('YYYY');
    var maxYear = max.format('YYYY');
    var minMonth = min.format('MMM');
    var maxMonth = max.format('MMM');
    var minDay = min.format('D');
    var maxDay = max.format('D');
    var rangeString;
    if (minYear != maxYear) {
        // years differ
        rangeString = minMonth + ' ' + minYear + ' - ' + maxMonth + ' ' + maxYear;
    } else if (minMonth != maxMonth) {
        // years are same and months differ
        rangeString = minMonth + ' ' + minDay + ' - ' + maxMonth + ' ' + maxDay + ', ' + minYear;
    } else if (minDay != maxDay) {
        // years/months are same and days differ
        rangeString = minMonth + ' ' + minDay + ' - ' + maxDay + ', ' + minYear;
    }
    return rangeString;

    // var leftString = moment.utc(this._focus).subtract(Array.isArray(this.timeScale.half) ? this.timeScale.half[0] : this.timeScale.half).format(this.dateFormat);
    // var rightString = moment.utc(this._focus).add(Array.isArray(this.timeScale.half) ? this.timeScale.half[1] : this.timeScale.half).format(this.dateFormat);

    // return leftString + ' - ' + rightString;
};

// CHART MANIPULATION /////////

// ModuleChartDetail.prototype.getHalfWidth = function() {
//     var halfWidth = {};
//     for (var k in this.timeScale.zoom) {
//         halfWidth[k] = this.timeScale.zoom[k] / 2;
//     }
//     return halfWidth;
// }

/**
 * update the chart
 * 
 * @param  {} t optional, passed to chart.update
 */
ModuleChartDetail.prototype.updateChart = function (t) {
    // set viewport on chart
    if (!this._chart) return;

    console.log('updateChart, focusing on: ' + this._focus.format());
    if (this._zoomLevel == 6) {
        this.xAxis.time.unit = 'day';
        this.xAxis.time.min = moment.utc(this._focus).subtract(this.timeScale.half[0]).format();
        this.xAxis.time.max = moment.utc(this._focus).add(this.timeScale.half[1]).format();
    } else {
        this.xAxis.time.unit = this.timeScale.unit;
        this.xAxis.time.min = moment.utc(this._focus).subtract(Array.isArray(this.timeScale.half) ? this.timeScale.half[0] : this.timeScale.half).format('YYYY-MM-DD');
        this.xAxis.time.max = moment.utc(this._focus).add(Array.isArray(this.timeScale.half) ? this.timeScale.half[1] : this.timeScale.half).format('YYYY-MM-DD');
    }

    console.log('chart min/max: ' + this.xAxis.time.min + ' - ' + this.xAxis.time.max);

    //console.log(this._chart.options.scales.xAxes[0].time.min + ', ' + this._chart.options.scales.xAxes[0].time.max)
    //console.log(this.zooms[this._zoomLevel]);

    //this._chart.scales['x-axis-0'].options.time.max = this._focus.format();
    //this._chart.scales['x-axis-0'].options.time.min = this._focus.subtract(this.zooms[this._zoomLevel]).format();
    //xAxis.time.max = max.format();
    //xAxis.time.min = viewport.getRightEdge().subtract(viewport.getZoomParams()).format();
    //config.options.scales.xAxes[0] = xAxis;  

    // update chart legend
    this._chart.options.title.text = this.getRangeString();

    // set datepicker date to focus
    this._pickadate.set('select', this._focus.format('YYYY-MM-DD'), {
        muted: true
    });
    //$(this._dateDisplay).datetimepicker('date', this._focus);

    // set input value to focus
    this._inputValue.value = this.getDatasetValue(this._focus.format('YYYY-MM-DD'));

    // add focus line
    // this._chart.options.verticalLine[0].x = this._focus.format('YYYY-MM-DD');
    // console.log('focus line set to ' + this._chart.options.verticalLine[0].x);

    // update chart
    this._chart.update(t);

    console.log('chart updated, x axis options:');
    console.log(this.xAxis);
};

// UTILITY FUNCTIONS
/**
 * get dataset value at date x
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
ModuleChartDetail.prototype.getDatasetValue = function (x, setIndex) {
    var data = this.datasets[setIndex].data;
    for (var i = 0; i < data.length; i++) {
        if (data[i].x == x) {
            return data[i].y;
        }
    }
    return "0";
};

/**
 * get whether dataset value at date x exists
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
ModuleChartDetail.prototype.getDatasetValueExists = function (x, setIndex = 0) {
    var data = this.datasets[setIndex].data;
    for (var i = 0; i < data.length; i++) {
        if (data[i].x == x) {
            return true;
        }
    }
    return false;
};

/**
 * set dataset value at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 * @param  {} y value
 */
ModuleChartDetail.prototype.setDatasetValue = function (x, y, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    var newPoint = {
        x: x,
        y: y
    };

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == x) {
            // update existing value
            data[i].y = y;
            return;
        }

        // is it before this one?
        if (moment(x).isBefore(moment(data[i].x))) {
            if (i == 0)
                data.unshift(newPoint);
            else
                data.splice(i, 0, newPoint);
            return;
        }
    }

    // is data off the end? add at end
    data.push(newPoint);
};

/**
 * set datapoint at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 * @param  {} datapoint point
 * @param  {} setIndex which dataset
 */
ModuleChartDetail.prototype.setDatasetPoint = function (x, datapoint, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    // var newPoint = {
    //     x: x,
    //     y: y
    // };

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == datapoint.x) {
            // update existing value
            // data[i].y = y;
            data[i] = datapoint;
            return;
        }

        // is it before this one?
        if (moment(datapoint.x).isBefore(moment(data[i].x))) {
            if (i == 0)
                data.unshift(datapoint);
            else
                data.splice(i, 0, datapoint);
            return;
        }
    }

    // is data off the end? add at end
    data.push(datapoint);
};

/**
 * get a new array of all the datapoints between two dates, inclusive
 * 
 * @param {string} start 'YYYY-MM-DD' format
 * @param {string} end 'YYYY-MM-DD' format
 * @param {number} setIndex which dataset
 */
function getRange(start, end, setIndex = 0) {
    let retval = [];
    if (this.datasets.length <= setIndex) return retval;

    var data = this.datasets[setIndex].data;

    let mStart = moment(start);
    let mEnd = moment(end);

    for (let i = 0; i < data.length; i++) {
        let mDate = moment(data[i].x);
        if (mStart.isSameOrBefore(mDate) &&
            mEnd.isSameOrAfter(mDate)) {
            retval.push(data[i]);
        }
    }
    return retval;
}
ModuleChartDetail.prototype.getRange = getRange;

function getTagCloud(start, end, setIndex = 0) {
    let data = this.getRange(start, end, setIndex);
    let retval = {};
    for (let i in data) {
        let tags = data[i].tags;
        if (tags && Array.isArray(tags)) {
            for (let j in tags) {
                let tag = tags[j];

                let existing = retval[tag];
                if (!existing) {
                    retval[tag] = {
                        number: 1,
                        // color: this.getColor(setIndex)
                    };
                } else {
                    retval[tag].number++;
                }
            }
        }
    }
    return retval;
}
ModuleChartDetail.prototype.getTagCloud = getTagCloud;

function updateTagCloud() {
    let min = this._chart.options.scales.xAxes[0].time.min;
    let max = this._chart.options.scales.xAxes[0].time.max;
    let output = '';
    this.datasets.forEach((dataset, i) => {
        let tagData = this.getTagCloud(min, max, i);
        let color = this.getColor(i);
        // console.log(i, this.getColor(i));
        for (let key in tagData) {
            let tag = tagData[key];
            let textsize = (0.75 + tag.number * 0.25) + 'rem';
            output += `<span class="m-1" style="color: ${color}; font-size: ${textsize}">${key}</span>`;
        }
    });

    this._tagCloudHolder.innerHTML = output;
}
ModuleChartDetail.prototype.updateTagCloud = updateTagCloud;

/**
 * delete dataset value at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
ModuleChartDetail.prototype.deleteDatasetValue = function (x, setIndex = 0) {
    var data = this.datasets[setIndex].data;

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == x) {
            // delete existing value
            data.splice(i, 1);
            return;
        }
    }
};

// INTERNALS
ModuleChartDetail.prototype.defaultConfig = {
    type: "line",
    options: {
        scales: {
            xAxes: [{
                type: 'time',
            }],
            yAxes: [{}]
        },
        tooltips: {
            mode: 'nearest',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    speed: 1,
                    threshold: 1
                },
                zoom: {
                    enabled: false,
                    mode: 'y'
                }
            }
        }
    }
};

module.exports = ModuleChartDetail;