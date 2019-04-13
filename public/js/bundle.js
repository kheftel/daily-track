(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var ChartController = require('./js/modules/ChartController');
require('./js/toast.js');

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
        $('#sidebar').toggleClass('active');

        $('#content').toggleClass('fx-blur-when-small');
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
},{"./js/modules/ChartController":2,"./js/toast.js":3}],2:[function(require,module,exports){
ChartController = function (container) {
    // copy config
    this._config = JSON.parse(JSON.stringify(p.defaultConfig));

    if (typeof container == 'string')
        container = document.getElementById(container);

    this._chartContainer = document.createElement('div');
    this._chartContainer.style.height = 'calc(100% - 60px)';
    this._chartContainer.style.width = "100%";
    this._chartContainer.style.position = 'relative';
    container.appendChild(this._chartContainer);
    this._container = container;

    this._canvas = document.createElement('canvas');
    this._chartContainer.appendChild(this._canvas);

    this._footer = document.createElement('div');
    this._footer.classList.add('controlbar', 'd-flex', 'justify-content-center', 'align-items-center', 'py-2');
    this._container.appendChild(this._footer);

    this._btnLeft = document.createElement('button');
    this._btnLeft.classList.add('btn', 'btn-primary');
    this._btnLeft.innerHTML = '<span class="fas fa-angle-double-left"></i>'; //'&lt;&lt;';
    this._btnLeft.addEventListener('click', () => {
        this.panLeft();
    });
    this._footer.appendChild(this._btnLeft);

    this._btnRight = document.createElement('button');
    this._btnRight.classList.add('btn', 'btn-primary');
    this._btnRight.innerHTML = '<span class="fas fa-angle-double-right"></i>'; //'&gt;&gt;';
    this._btnRight.addEventListener('click', () => {
        this.panRight();
    });
    this._footer.appendChild(this._btnRight);

    this._btnZoomOut = document.createElement('button');
    this._btnZoomOut.classList.add('btn', 'btn-primary');
    this._btnZoomOut.innerHTML = '<span class="fas fa-search-minus"></i>'; //'-';
    this._btnZoomOut.addEventListener('click', () => {
        this.zoomOut();
    });
    this._footer.appendChild(this._btnZoomOut);

    this._btnZoomIn = document.createElement('button');
    this._btnZoomIn.classList.add('btn', 'btn-primary');
    this._btnZoomIn.innerHTML = '<span class="fas fa-search-plus"></i>'; //'+';
    this._btnZoomIn.addEventListener('click', () => {
        this.zoomIn();
    });
    this._footer.appendChild(this._btnZoomIn);

    this._toggleHTML = {
        'line': '<span class="fas fa-chart-line"></i>',
        'bar': '<span class="fas fa-chart-bar"></i>'
    };
    this._btnType = document.createElement('button');
    this._btnType.classList.add('btn', 'btn-primary');
    this._btnType.classList.add('d-none');
    this._btnType.innerHTML = '<span class="fas fa-chart-line"></i>';
    this._btnType.addEventListener('click', () => {
        if(this.datasets.length == 1) {
            var set = this.datasets[0];
            if(set.type == 'line')
                set.type = 'bar';
            else
                set.type = 'line';
            this._btnType.innerHTML = this._toggleHTML[set.type];

            this.updateChart();
        }
    });
    this._footer.appendChild(this._btnType);

    // this._btnAdd = document.createElement('button');
    // this._btnAdd.classList.add('btn', 'btn-primary');
    // this._btnAdd.innerHTML = '<span class="fas fa-pencil-alt"></i>';
    // this._btnAdd.addEventListener('click', function () {
    // });
    // this._footer.appendChild(this._btnAdd);

    this._chart = new Chart(this._canvas, this._config);
    this._datasetIds = [];
    this._right = moment.utc();

    this._colorOffset = 0;
    this._colorScheme = this.defaultColorScheme;

    this.setZoomLevel(this.defaultZoomLevel, false);
};

var p = ChartController.prototype;

// DATA, LOADING /////////
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
}

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

    var next = function() {
        console.log(which + '/' + ids.length);
        if(which < ids.length)
        {
            load(ids[which]);
            which++;
        }
        else if(which == ids.length)
        {
            // all done
            datasets.forEach((set, i) => {
                console.log('adding set ' + i + ', id=' + set._id);
                this.addDatasetFromModel(set);
            });

            this.updateChart();
        }
    }.bind(this);

    next();
}

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

    // disable chart type toggle btn if multiple sets
    if(this.datasets.length > 1) {
        $(this._btnType).addClass('d-none');
    }
    else {
        $(this._btnType).removeClass('d-none').html(this._toggleHTML[dataset.type]);
    }

    // update chart
    this.updateChart();

    if (complete) complete();
}

Object.defineProperty(p, 'datasets', {
    get() {
        return this._chart.data.datasets;
    }
})

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
    chartjs: [chartColors.red, chartColors.orange, chartColors.yellow, chartColors.green, chartColors.blue, chartColors.purple, chartColors.grey]
}

p.defaultColorScheme = 'vividRainbow';

Object.defineProperty(p, 'schemeNames', {
    get() {
        return Object.keys(p.colorSchemes);
    }
});

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
        this.updateChart();
    }
});

p.refreshColorsFromScheme = function () {
    for (var i = 0; i < this.datasets.length; i++) {
        var set = this.datasets[i];
        set.pointBackgroundColor = this.getColor(i);
        set.pointBorderColor = this.getColor(i);
        set.borderColor = this.getColor(i);
    }
}

Object.defineProperty(p, 'colorOffset', {
    get() {
        return this._colorOffset
    },
    set(i) {
        this._colorOffset = i;

        this.refreshColorsFromScheme();
        this.updateChart();
    }
});

p.getColor = function (i = 0) {
    var scheme = this.colorSchemes[this._colorScheme];
    return scheme[(i + this._colorOffset) % scheme.length];
}

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

p.timeScales = [
    {
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
        half: {
            'days': 3
        },
        pan: {
            'days': 1
        },
        unit: 'day'
    }
]

p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 3;

/** xAxis */
Object.defineProperty(p, 'xAxis', {
    get() {
        return this._chart.options.scales.xAxes[0];
    }
});

/** xAxisLabel */
Object.defineProperty(p, 'xAxisLabel', {
    get() {
        return this.xAxis.scaleLabel.labelString;
    },
    set(val) {
        this.xAxis.scaleLabel.labelString = val;
        this.updateChart();
    }
});

/** yAxis */
Object.defineProperty(p, 'yAxis', {
    get() {
        return this._chart.options.scales.yAxes[0];
    }
});

/** yAxisLabel */
Object.defineProperty(p, 'yAxisLabel', {
    get() {
        return this.yAxis.scaleLabel.labelString;
    },
    set(val) {
        this.yAxis.scaleLabel.labelString = val;
        this.updateChart();
    }
});

p.setZoomLevel = function (val, update = true) {
    val = Math.max(0, Math.min(val, this.timeScales.length - 1));
    this._zoomLevel = val;
    // console.log('zoom level: ' + this._zoomLevel);

    if (update)
        this.updateChart();
};

p.getZoomLevel = function () {
    return this._zoomLevel;
};

p.zoomIn = function (update = true) {
    this.setZoomLevel(this._zoomLevel + 1, update);
};

p.zoomOut = function (update = true) {
    this.setZoomLevel(this._zoomLevel - 1, update);
};

/** timeScale */
Object.defineProperty(p, 'timeScale', {
    get() {
        return this.timeScales[this._zoomLevel];
    }
});

p.getRightEdge = function () {
    return this._right;
}

p.panRight = function (update = true) {
    // this._right.add(this.pans[this._zoomLevel]);
    this._right.add(this.timeScale.pan);
    if (update)
        this.updateChart();
}

p.panLeft = function (update = true) {
    // this._right.subtract(this.pans[this._zoomLevel]);
    this._right.subtract(this.timeScale.pan);
    if (update)
        this.updateChart();
}

p.showAll = function (update = true) {
    var data = this._chart.data.datasets[0].data;
    var first = data[0].x;
    var last = data[data.length - 1].x;
    this._chart.options.scales.xAxes[0].time.min = first;
    this._chart.options.scales.xAxes[0].time.max = last;
    if (update)
        this._chart.update();
}

p.getRangeString = function () {
    var leftString = moment.utc(this._right).subtract(this.timeScale.half).format(this.dateFormat);
    var rightString = moment.utc(this._right).add(this.timeScale.half).format(this.dateFormat);

    // var rightString = this._right.format(this.dateFormat);
    // var leftString = moment.utc(this._right).subtract(this.timeScale.zoom).format(this.dateFormat);
    return leftString + ' - ' + rightString + ' - (' + this.timeScale.label + ')';
}

// CHART MANIPULATION /////////

// p.getHalfWidth = function() {
//     var halfWidth = {};
//     for (var k in this.timeScale.zoom) {
//         halfWidth[k] = this.timeScale.zoom[k] / 2;
//     }
//     return halfWidth;
// }

p.updateChart = function (t) {
    // set viewport on chart
    if (!this._chart) return;

    this.xAxis.time.min = moment.utc(this._right).subtract(this.timeScale.half).format();
    this.xAxis.time.max = moment.utc(this._right).add(this.timeScale.half).format();
    this.xAxis.time.unit = this.timeScale.unit;

    // console.log(this.xAxis.time.min);
    // console.log(this.xAxis.time.max);

    //console.log(this._chart.options.scales.xAxes[0].time.min + ', ' + this._chart.options.scales.xAxes[0].time.max)
    //console.log(this.zooms[this._zoomLevel]);

    //this._chart.scales['x-axis-0'].options.time.max = this._right.format();
    //this._chart.scales['x-axis-0'].options.time.min = this._right.subtract(this.zooms[this._zoomLevel]).format();
    //xAxis.time.max = max.format();
    //xAxis.time.min = viewport.getRightEdge().subtract(viewport.getZoomParams()).format();
    //config.options.scales.xAxes[0] = xAxis;  

    this._chart.options.title.text = this.getRangeString();

    this._chart.update(t);

    //console.log(this.getRangeString());
}

// UTILITY FUNCTIONS
p.normalizeDates = function (data) {
    for (var i = 0; i < data.length; i++) {
        var datum = data[i];
        datum.x = moment(datum.x).utc().format('YYYY-MM-DD');
    }
    return data;
}

// INTERNALS
p.defaultXAxis = {
    type: 'time',
    time: {
        unit: 'day',
        tooltipFormat: 'MM/DD/YYYY'
    },
    distribution: 'linear',
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'no data'
    },
    ticks: {
        autoSkip: true,
        source: 'auto'
    }
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
Chart.defaults.global.layout.padding = 0;

Chart.defaults.global.legend.position = 'top';
Chart.defaults.global.legend.labels.fontColor = 'white';

Chart.defaults.global.title.display = true;
Chart.defaults.global.title.fontColor = 'white';
Chart.defaults.global.title.fontSize = 20;

Chart.defaults.global.elements.point.radius = 5;
Chart.defaults.global.elements.point.hoverRadius = 10;
Chart.defaults.global.elements.line.tension = 0;
Chart.defaults.global.elements.rectangle.borderWidth = 2;

Chart.scaleService.updateScaleDefaults('linear', {
    ticks: {
        fontColor: 'white', // labels such as 10, 20, etc
        showLabelBackdrop: false // hide square behind text
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
    ticks: {
        fontColor: 'white', // labels such as 10, 20, etc
        showLabelBackdrop: false // hide square behind text
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

Chart.scaleService.updateScaleDefaults('radial', {
    angleLines: {
        color: 'white' // lines radiating from the center
    },
    pointLabels: {
        fontColor: 'white' // labels around the edge like 'Running'
    }
});

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
            html += '<div class="toast-body">'
            html += content
            html += '</div>';
        }

        html += '</div>';

        $('#toast-wrapper').append(html);
        $('#toast-wrapper .toast:last').toast('show');
    }
}(jQuery));
},{}]},{},[1]);
