(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var ChartController = require('./js/ChartController');
// require('./js/lib/jquery-3.2.1.min.js');
// require('./js/lib/popper.min.js');
// require('./js/lib/bootstrap.min.js');
// require('./js/lib/bootstrap-confirmation.min.js');
// require('./js/lib/moment.min.js');
// require('./js/lib/Chart.min.js');
require('./js/lib/toast.js');

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
    $('#sidebarCollapse').on('click', function () {
        // slide sidebar
        $('#sidebar').toggleClass('active');

        // blur content
        $('#content').toggleClass('fx-blur-when-small');

        // disable body scrolling
        $('body').toggleClass('modal-open');

        // show backdrop
        $('#sidebar-shade').toggleClass('show');
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
},{"./js/ChartController":2,"./js/lib/toast.js":3}],2:[function(require,module,exports){
/**
 * Wraps a chart.js chart and provides an interface to it
 * 
 * @param  {} container the html element where we put our markup
 */
var _numControllers = 0;
ChartController = function (container) {
    // parent container can be id or html elem
    if (typeof container == 'string')
        container = document.getElementById(container);

    if (!container)
        throw new Error('chart: container not found');

    this._parentContainer = container;
    var parentData = container.dataset;

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
        this._parentContainer,
        ['card', 'border-light', 'shadow-rb'],
        'height: 400px; opacity: 0; transition: opacity 0.5s;'
    );
    this._cardHeader = elem('div', this._main, ['card-header', 'd-flex', 'align-items-center', 'p-2']);
    this._detailLink = elem('a', this._cardHeader, ['align-middle', 'm-0', 'h5'], null, parentData.setname);
    this._detailLink.href = '/set/' + parentData.setid;

    this._drpHeader = elem('div', this._cardHeader, ['dropdown', 'ml-auto']);
    this._drpHeaderBtn = elem('button', this._drpHeader, ['btn', 'btn-outline-success', 'dropdown-toggle']);
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

    this._editButton = iconLink(['dropdown-item'], this._drpHeaderBody, 'fa-edit', 'Edit');
    //iconButton(['ml-auto', 'dropdown-item'], this._drpHeaderBody, 'fa-edit');
    this._toggleHTML = {
        'bar': '<span class="fas fa-chart-line"></span>Show as line Chart',
        'line': '<span class="fas fa-chart-bar"></span>Show as bar Chart'
    };
    this._btnType = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-chart-line', 'Line Chart', '#', (e) => {
        e.preventDefault();
        if (this.datasets.length == 1) {
            var set = this.datasets[0];
            if (set.type == 'line') {
                set.type = 'bar';
                this._btnType.innerHTML = this._toggleHTML.bar;
            }
            else {
                set.type = 'line';
                this._btnType.innerHTML = this._toggleHTML.line;
            }

            this.updateChart();
        }
    });
    this._deleteButton = iconLink(['d-none', 'dropdown-item'], this._drpHeaderBody, 'fa-trash-alt', 'Delete', '#');

    this._cardBody = elem('div', this._main, 'card-body', 'position: relative;');
    this._chartContainer = elem('div', this._cardBody, 'chartcontainer');

    // holds the canvas for the chart
    this._canvasholder = elem(
        'div',
        this._chartContainer,
        null,
        'height: calc(100% - 96px); width: 100%; width: relative;'
    );

    // canvas the chart is rendered on
    this._canvas = elem('canvas', this._canvasholder);

    // footer with buttons to manipulate chart
    this._footer = elem('div', this._chartContainer, ['controlbar']);

    this._row1 = elem('div', this._footer, ['buttonrow', 'd-flex', 'justify-content-center', 'align-items-center', 'p-1', 'bg-gray-700'], 'max-width: 300px; margin: 0 auto; border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.2);');
    this._row2 = elem('div', this._footer, ['buttonrow', 'd-flex', 'form-inline', 'justify-content-center', 'align-items-center', 'p-1']);

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
    this._dateDisplay = elem('input', this._row1, ['form-control', 'datetimepicker-input'], 'max-width: 8rem;');
    this._dateDisplay.id = datefocusid;
    $(this._dateDisplay)
        .attr('data-toggle', 'datetimepicker')
        .attr('data-target', '#' + datefocusid)
        .datetimepicker({
            format: 'L'
        });
    // set date picker value
    $(this._dateDisplay).datetimepicker('date', this._focus);
    // adjust chart when date picker changes
    $(this._dateDisplay).on('change.datetimepicker', (e) => {
        var newFocus = moment(e.date).utc().startOf('day');
        console.log('date picker changed: ' + newFocus.format());
        this._focus = newFocus;
        this.updateChart();
    });

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
    this._config = JSON.parse(JSON.stringify(p.defaultConfig));
    this._config.options.onClick = (e, arr) => {
        console.log(arr);
        if(!Array.isArray(arr) || arr.length == 0) return;
        var p = arr[0];
        if(p == null || p._datasetIndex == null || p._index == null) return;
        var datapoint = this.datasets[p._datasetIndex].data[p._index];
        var newFocus = moment(datapoint.x).utc().startOf('day');
        console.log('clicked datapoint, focusing on: ' + newFocus.format());
        this._focus = newFocus;
        this.updateChart();
    };
    
    this._chart = new Chart(this._canvas, this._config);
    this._datasetIds = [];

    this.setZoomLevel(this.defaultZoomLevel, false);

    this._id = _numControllers;
    _numControllers++;
};
var p = ChartController.prototype;

// some defaults
p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 6;

p.defaultButtonClasses = ['btn', 'btn-outline-success'];

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
    var result = elem('button', parent, p.defaultButtonClasses.concat(classList), style, `<span class="fas ${icon}"></i>`);
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
    var result = elem('a', parent, classList, style, `<span class="fas ${icon}"></span>${text}`);
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
p.addDataset = function (id, complete) {
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
p.addDatasetsFromIds = function (ids) {
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

            this.updateChart();
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
p.addDatasetFromModel = function (dataset, complete) {
    // translate for chart dataset object
    dataset.type = dataset.chartType;
    dataset.label = dataset.name;
    dataset.data = this.normalizeDates(dataset.data);
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
        //$(this._btnAdd).addClass('d-none');
        $(this._row2).removeClass('d-flex').addClass('d-none');
        $(this._deleteButton).addClass('d-none');
    } else {
        // show type toggle btn
        $(this._btnType).removeClass('d-none').html(this._toggleHTML[dataset.type]);
        // $(this._btnAdd).removeClass('d-none').attr('href', '/set/' + dataset._id + '/new');

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

        // show and activate delete button - disabled for now
        $(this._deleteButton).removeClass('d-none').confirmation({
            rootSelector: this._deleteButton,
            popout: true,
            container: 'body',
            title: 'Are you sure you want to delete ' + dataset.name + ' AND all of its data?'
        }).on('click', (e) => {
            e.preventDefault();

            $.toast({
                title: 'Info',
                content: 'Delete currently disabled',
                type: 'info',
                delay: 5000
            });

            if (this.datasets.length != 1) throw new Error('cannot delete if empty or in multi-mode');

            // TO DO: what to do with the dataset's points?

            // delete set from database
            /*$.ajax({
                url: '/api/sets/' + dataset._id,
                method: 'DELETE',
                success: (response) => {
                    console.log(response);

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
                                content: response.message,
                                type: 'success',
                                delay: 5000
                            });
                        });
                },
                error: (err) => {
                    console.log(err);

                    $.toast({
                        title: 'Error!',
                        content: err.message,
                        type: 'error',
                        delay: 5000
                    });
                }
            });*/
        });
    }

    console.log('dataset added:');
    console.log(dataset);

    console.log('scaleservice time defaults:');
    console.log(Chart.scaleService.defaults.time);

    // update chart
    this.updateChart();

    this._main.style.opacity = 1;

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

p.colorSchemes = {
    vividRainbow: ['#00AAEE', '#A6D608', '#FFE302', '#FF5F00', '#F70D1A', '#9F00FF'],
    darkly: ["#3498DB", "#00bc8c", "#ffef00", "#F39C12", "#fd7e14", "#E74C3C", "#e83e8c", "#6f42c1", "#6610f2", "#375a7f"],
    chartjs: [chartColors.red, chartColors.orange, chartColors.yellow, chartColors.green, chartColors.blue, chartColors.purple, chartColors.grey]
};

p.defaultColorScheme = 'darkly';

/** color scheme names (readonly) */
Object.defineProperty(p, 'schemeNames', {
    get() {
        return Object.keys(p.colorSchemes);
    }
});

/** get/set color scheme. does NOT update chart, you must do that manually */
Object.defineProperty(p, 'colorScheme', {
    get() {
        return this._colorScheme;
    },
    set(value) {
        if (p.schemeNames.indexOf(value) == -1)
            throw new Error('schemeName must be one of: ' + p.schemeNames.toString());

        this._colorScheme = value;
        this._colorOffset = 0;
        this.refreshColorsFromScheme();
    }
});

/**
 * apply color scheme to chart options.
 */
p.refreshColorsFromScheme = function () {
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
p.getColor = function (i = 0) {
    var scheme = this.colorSchemes[this._colorScheme];
    return scheme[(i + this._colorOffset) % scheme.length];
};

/*p.setColorScheme = function(scheme) {
    this._colorScheme = scheme;

    this._chart.data.datasets.foreach(function(v, i, a) {
        v.
    });

    pointBackgroundColor: window.chartColors.orange,
    pointBorderColor: window.chartColors.orange,
    borderColor: Color(window.chartColors.orange)

}*/

// ZOOMING and PANNING //////////

p.timeScales = [{
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
p.setZoomLevel = function (val, update = true) {
    if(val < 0 || val >= this.timeScales.length) {
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
p.getZoomLevel = function () {
    return this._zoomLevel;
};

/**
 * zoom in one level
 * 
 * @param  {} update=true
 */
p.zoomIn = function (update = true) {
    this.setZoomLevel(this._zoomLevel + 1, update);
};
/**
 * zoom out one level
 * 
 * @param  {} update=true
 */
p.zoomOut = function (update = true) {
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
p.getFocus = function () {
    return this._focus.format('YYYY-MM-DD');
};

/**
 * pan to the right one unit based on timescale
 * 
 * @param  {} update=true
 */
p.panRight = function (update = true) {
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
p.panLeft = function (update = true) {
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
p.showAll = function (update = true) {
    var data = this._chart.data.datasets[0].data;
    var first = data[0].x;
    var last = data[data.length - 1].x;
    this._chart.options.scales.xAxes[0].time.min = first;
    this._chart.options.scales.xAxes[0].time.max = last;
    if (update)
        this._chart.update();
};

/**
 * returns a convenience string for labeling
 */
p.getRangeString = function () {
    // TO DO: don't repeat unnecessary information, like moodtrack
    var leftString = moment.utc(this._focus).subtract(Array.isArray(this.timeScale.half) ? this.timeScale.half[0] : this.timeScale.half).format(this.dateFormat);
    var rightString = moment.utc(this._focus).add(Array.isArray(this.timeScale.half) ? this.timeScale.half[1] : this.timeScale.half).format(this.dateFormat);

    // var rightString = this._focus.format(this.dateFormat);
    // var leftString = moment.utc(this._focus).subtract(this.timeScale.zoom).format(this.dateFormat);
    return leftString + ' - ' + rightString;
    // return [leftString, rightString, this.timeScale.label];
};

// CHART MANIPULATION /////////

// p.getHalfWidth = function() {
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
p.updateChart = function (t) {
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
    $(this._dateDisplay).datetimepicker('date', this._focus);

    this._inputValue.value = this.getDatasetValue(this._focus.format('YYYY-MM-DD'));

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
p.getDatasetValue = function (x) {
    var data = this.datasets[0].data;
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
p.getDatasetValueExists = function (x) {
    var data = this.datasets[0].data;
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
p.setDatasetValue = function (x, y) {
    var data = this.datasets[0].data;

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
 * delete dataset value at date x. does NOT update chart
 * 
 * @param  {} x date in 'YYYY-MM-DD' format
 */
p.deleteDatasetValue = function (x) {
    var data = this.datasets[0].data;

    for (var i = 0; i < data.length; i++) {
        // is it equal to this date?
        if (data[i].x == x) {
            // delete existing value
            data.splice(i, 1);
            return;
        }
    }
};

p.normalizeDates = function (data) {
    for (var i = 0; i < data.length; i++) {
        var datum = data[i];
        datum.x = moment(datum.x).utc().format('YYYY-MM-DD');
    }
    return data;
};

// INTERNALS
p.defaultXAxis = {
    type: 'time',
    // time: {
    //     unit: 'day',
    //     tooltipFormat: 'MM/DD/YYYY'
    // },
    // distribution: 'linear',
    // display: true,
    // scaleLabel: {
    //     display: false,
    //     labelString: 'no data'
    // },
    // ticks: {
    //     autoSkip: true,
    //     source: 'auto'
    // }
};

p.defaultYAxis = {
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'no data'
    }
};

p.defaultConfig = {
    type: "bar",
    options: {
        scales: {
            xAxes: [p.defaultXAxis],
            yAxes: [p.defaultYAxis]
        },
        plugins: {
            /*zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    enabled: true,
                    mode: 'x'
                }
            }*/
        }
    }
};

Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.responsive = true;
Chart.defaults.global.defaultFontFamily = '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
Chart.defaults.global.layout.padding = 0;
Chart.defaults.global.legend.position = 'top';
Chart.defaults.global.legend.labels.padding = 8;
Chart.defaults.global.legend.labels.usePointStyle = true;
Chart.defaults.global.legend.labels.fontColor = 'white';

Chart.defaults.global.title.display = true;
Chart.defaults.global.title.fontColor = 'white';
Chart.defaults.global.title.fontSize = 16;
Chart.defaults.global.title.padding = 4;

Chart.defaults.global.elements.point.radius = 5;
Chart.defaults.global.elements.point.hoverRadius = 10;
Chart.defaults.global.elements.line.tension = 0;
Chart.defaults.global.elements.rectangle.borderWidth = 2;

Chart.scaleService.updateScaleDefaults('linear', {
    ticks: {
        fontColor: 'white',
        // callback: function (value, index, values) {
        //     console.log('x-linear-tick: ' + value + ', ' + index + ', ' + values);
        //     return value;
        // },
        maxRotation: 0

        //showLabelBackdrop: false // hide square behind text
    },
    gridLines: {
        color: 'rgba(255, 255, 255, 0.2)'
    },
    scaleLabel: {
        display: true,
        fontColor: 'white',
        labelString: 'no data'
    },
});

Chart.scaleService.updateScaleDefaults('time', {
    minUnit: 'day',
    gridLines: {
        color: 'rgba(255, 255, 255, 0.2)'
    },
    ticks: {
        maxRotation: 0
    }
    //     ticks: {
    //         autoSkip: false,
    //         fontColor: 'white',
    //         maxRotation: 0
    //     },
    //     gridLines: {
    //         color: 'rgba(255, 255, 255, 0.2)'
    //     },
    //     scaleLabel: {
    //         display: true,
    //         fontColor: 'white',
    //         labelString: 'no data'
    //     },
});

// Chart.scaleService.updateScaleDefaults('radial', {
//     angleLines: {
//         color: 'white' // lines radiating from the center
//     },
//     pointLabels: {
//         fontColor: 'white' // labels around the edge like 'Running'
//     }
// });

module.exports = ChartController;
},{}],3:[function(require,module,exports){
/**
 * @author Script47 (https://github.com/Script47/Toast)
 * @description Toast - A Bootstrap 4.2+ jQuery plugin for the toast component
 * @version 0.6.0
 **/
(function ($) {
    const TOAST_CONTAINER_HTML = '<div id="toast-container" aria-live="polite" aria-atomic="true"></div>';
    const TOAST_WRAPPER_HTML = '<div id="toast-wrapper"></div>';

    $.toast = function (opts) {
        if (!$('#toast-container').length) {
            $('body').prepend(TOAST_CONTAINER_HTML);
            $('#toast-container').append(TOAST_WRAPPER_HTML);

            $('body').on('hidden.bs.toast', '.toast', function () {
                $(this).remove();
            });
        }

        let bg_header_class = '',
            fg_header_class = '',
            fg_subtitle_class = 'text-muted',
            fg_dismiss_class = '',
            title = opts.title || 'Notice!',
            subtitle = opts.subtitle || '',
            content = opts.content || '',
            type = opts.type || 'info',
            delay = opts.delay || -1,
            img = opts.img;

        switch (type) {
            case 'info':
                bg_header_class = 'bg-info';
                fg_header_class = 'text-white';
                fg_subtitle_class = 'text-white';
                fg_dismiss_class = 'text-white';
                break;

            case 'success':
                bg_header_class = 'bg-success';
                fg_header_class = 'text-white';
                fg_subtitle_class = 'text-white';
                fg_dismiss_class = 'text-white';
                break;

            case 'warning':
            case 'warn':
                bg_header_class = 'bg-warning';
                fg_header_class = 'text-white';
                fg_subtitle_class = 'text-white';
                fg_dismiss_class = 'text-white';
                break;

            case 'error':
            case 'danger':
                bg_header_class = 'bg-danger';
                fg_header_class = 'text-white';
                fg_subtitle_class = 'text-white';
                fg_dismiss_class = 'text-white';
                break;
        }

        let delay_or_autohide = '';

        if (delay === -1) {
            delay_or_autohide = 'data-autohide="false"';
        } else {
            delay_or_autohide = 'data-delay="' + delay + '"';
        }

        let html = '<div class="toast" role="alert" aria-live="assertive" aria-atomic="true" ' + delay_or_autohide + '>';
        html += '<div class="toast-header ' + bg_header_class + ' ' + fg_header_class + '">';

        if (typeof img !== 'undefined') {
            html += '<img src="' + img.src + '" class="' + (img.class || '') + ' mr-2" alt="' + (img.alt || 'Image') + '" ' + (typeof img.title !== 'undefined' ? 'data-toggle="tooltip" title="' + img.title + '"' : '') + '>';
        }

        html += '<strong class="mr-auto">' + title + '</strong>';
        html += '<small class="' + fg_subtitle_class + '">' + subtitle + '</small>';
        html += '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">';
        html += '<span aria-hidden="true" class="' + fg_dismiss_class + '">&times;</span>';
        html += '</button>';
        html += '</div>';

        if (content !== '') {
            html += '<div class="toast-body">';
            html += content;
            html += '</div>';
        }

        html += '</div>';

        $('#toast-wrapper').append(html);
        $('#toast-wrapper .toast:last').toast('show');
    };
}(jQuery));
},{}]},{},[1]);
