/**
 * Wraps a chart.js chart and provides an interface to it
 * 
 * @param  {} container the html element where we put our markup
 */
var numControllers = 0;
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
    this._editButton = iconButton(['ml-auto', 'btn', 'btn-primary', 'btn-shadow'], this._cardHeader, 'fa-edit');
    this._deleteButton = iconButton(['btn', 'btn-primary', 'btn-shadow', 'd-none'], this._cardHeader, 'fa-trash-alt');
    this._toggleHTML = {
        'line': '<span class="fas fa-chart-line"></i>',
        'bar': '<span class="fas fa-chart-bar"></i>'
    };
    this._btnType = iconButton(['btn', 'btn-primary', 'btn-shadow', 'd-none'], this._cardHeader, 'fa-chart-line', () => {
        if (this.datasets.length == 1) {
            var set = this.datasets[0];
            if (set.type == 'line')
                set.type = 'bar';
            else
                set.type = 'line';
            this._btnType.innerHTML = this._toggleHTML[set.type];

            this.updateChart();
        }
    });
    this._btnZoomOut = iconButton(['btn', 'btn-primary', 'btn-shadow'], this._cardHeader, 'fa-search-minus', () => {
        this.zoomOut();
    });
    this._btnZoomIn = iconButton(['btn', 'btn-primary', 'btn-shadow'], this._cardHeader, 'fa-search-plus', () => {
        this.zoomIn();
    });

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

    this._row1 = elem('div', this._footer, ['buttonrow', 'd-flex', 'justify-content-center', 'align-items-center', 'py-2']);
    this._row2 = elem('div', this._footer, ['buttonrow', 'd-flex', 'justify-content-center', 'align-items-center', 'py-2']);

    this._btnLeft = iconButton(['btn', 'btn-primary', 'btn-shadow'], this._row1, 'fa-angle-double-left', () => {
        this.panLeft();
    });

    numControllers++;
    var ddId = 'focuspicker' + numControllers;

    //<input type="text" class="form-control datetimepicker-input" id="datetimepicker5" data-toggle="datetimepicker" data-target="#datetimepicker5"/>

    // create datepicker component
    this._dateDisplay = elem('input', this._row1, ['form-control', 'datetimepicker-input'], 'max-width: 8rem;');
    this._dateDisplay.id = ddId;
    $(this._dateDisplay)
        .attr('data-toggle', 'datetimepicker')
        .attr('data-target', '#' + ddId)
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

    this._btnRight = iconButton(['btn', 'btn-primary', 'btn-shadow'], this._row1, 'fa-angle-double-right', () => {
        this.panRight();
    });
    // this._btnAdd = iconLinkButton(['btn', 'btn-primary', 'btn-shadow', 'd-none'], this._row2, 'fa-plus-square');
    this._currentValue = elem('input', this._row2, ['form-control'], 'max-width: 8rem;');
    this._saveCurrentValue = elem('button', this._row2, ['btn', 'btn-success'], null, 'Save');
    this._saveCurrentSpinner = elem('span', this._saveCurrentValue, ['d-none', 'spinner-border', 'spinner-border-sm', 'ml-1']);

    this._colorOffset = 0;
    this._colorScheme = this.defaultColorScheme;

    // create chart
    this._config = JSON.parse(JSON.stringify(p.defaultConfig));
    this._chart = new Chart(this._canvas, this._config);
    this._datasetIds = [];

    this.setZoomLevel(this.defaultZoomLevel, false);

};
var p = ChartController.prototype;

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
 * @param  {} classList
 * @param  {} parent
 * @param  {} icon
 * @param  {} click
 * @param  {} style
 */
function iconButton(classList, parent, icon, click, style) {
    var result = elem('button', parent, classList, style, `<span class="fas ${icon}"></i>`);
    if (click)
        $(result).click(click);
    return result;
}

/**
 * create a link that looks like a button
 * @param {*} classList 
 * @param {*} parent 
 * @param {*} icon 
 * @param {*} href 
 * @param {*} style 
 */
function iconLinkButton(classList, parent, icon, href, style) {
    var result = elem('a', parent, classList, style, `<span class="fas ${icon}"></i>`);
    if (href)
        result.href = href;
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
        $(this._btnType).removeClass('d-none').html(this._toggleHTML[dataset.type]);
        // $(this._btnAdd).removeClass('d-none').attr('href', '/set/' + dataset._id + '/new');
        $(this._row2).addClass('d-flex').removeClass('d-none');
        $(this._deleteButton).removeClass('d-none').confirmation({
            rootSelector: this._deleteButton,
            popout: true,
            container: 'body',
            title: 'Are you sure you want to delete ' + dataset.name + ' AND all of its data?'
        }).on('click', () => {
            if (this.datasets.length != 1) throw new Error('cannot delete if empty or in multi-mode');

            // TO DO: what to do with the dataset's points?

            // delete set from database
            $.ajax({
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
            });
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

p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 6;

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

    this._currentValue.value = this.getDatasetValue(this._focus.format('YYYY-MM-DD'));

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
p.getDatasetValue = function(x) {
    var data = this.datasets[0].data;
    for(var i = 0; i < data.length; i++) {
        if(data[i].x == x) {
            return data[i].y;
        }
    }
    return "0";
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
    /*time: {
        unit: 'day'
    },*/
    gridLines: {
        color: 'rgba(255, 255, 255, 0.2)'
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