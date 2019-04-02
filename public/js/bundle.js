(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var module = require('./modules/samplemodule');
var ChartController = require('./modules/ChartController');

// set up variables ///////////////

$(() => {
    console.log('main onload');

    // controller for chart
    var controller = new ChartController('mainChart');
    window.controller = controller;

    //getData();

    console.log('setting up interactivity');

    $('#minus').click(() => {
        controller.zoomOut();
    });

    $('#plus').click(() => {
        controller.zoomIn();
    });

    $('#left').click(() => {
        controller.panLeft();
    });

    $('#right').click(() => {
        controller.panRight();
    });

    $('#showall').click(() => {
        controller.showAll();
    });
});
},{"./modules/ChartController":2,"./modules/samplemodule":3}],2:[function(require,module,exports){
ChartController = function (canvas) {
    this._chart = new Chart(canvas, this.defaultConfig);

    this._right = moment.utc();

    this._colorOffset = 0;
    this._colorScheme = this.defaultColorScheme;

    this.setZoomLevel(this.defaultZoomLevel, false);

    // add a dataset
    $.ajax({
        url: '/api/sets/5ca00f23f968e4b0a2f36e0e/points',
        method: 'GET',
        success: (data) => {
            var dataset = {
                type: "line",
                label: "Meditation",
                data: this.normalizeDates(data),
                fill: false,
                pointBackgroundColor: this.getColor(),
                pointBorderColor: this.getColor(),
                borderColor: this.getColor()
            };
            this._chart.data.datasets.push(dataset);
            this.updateChart();
        },

        error: (err) => {
            console.log('Failed');
        }
    });
};

var p = ChartController.prototype;

p.xAxis = {
    type: 'time',
    time: {
        minUnit: 'day',
        tooltipFormat: 'MM/DD/YYYY'
    },
    distribution: 'linear',
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'Date'
    },
};

p.yAxis = {
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'Minutes'
    }
};

p.defaultConfig = {
    type: "line",
    options: {
        maintainAspectRatio: false,
        title: {
            display: true,
            fontSize: 20,
            text: ''
        },
        layout: {
            padding: 0
        },
        elements: {
            point: {
                radius: 5,
                hoverRadius: 10
            },
            line: {
                tension: 0
            },
            rectangle: {
                borderWidth: 2
            }
        },
        scales: {
            xAxes: [p.xAxis],
            yAxes: [p.yAxis]
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

Object.defineProperty(p, 'datasets', {
    get() {
        return this._chart.data.datasets;
    }
});

p.refreshColorsFromScheme = function() {
    for(var i = 0; i < this.datasets.length; i++) {
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

p.zooms = [{
        'years': 1
    },
    {
        'months': 6
    },
    {
        'months': 3
    },
    {
        'months': 1
    },
    {
        'weeks': 2
    },
    {
        'weeks': 1
    }
];

p.zoomLabels = [
    '1 Year',
    '6 Months',
    '3 Months',
    '1 Month',
    '2 Weeks',
    '1 Week'
];

p.pans = [{
        'months': 1
    },
    {
        'months': 1
    },
    {
        'weeks': 2
    },
    {
        'weeks': 1
    },
    {
        'days': 2
    },
    {
        'days': 1
    }
];

p.dateFormat = 'MM/DD/YYYY';

p.defaultZoomLevel = 3;

p.setZoomLevel = function (val, update = true) {
    val = Math.max(0, Math.min(val, this.zooms.length - 1));
    this._zoomLevel = val;
    console.log('zoom level: ' + this._zoomLevel);

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

p.getZoomParams = function () {
    return this.zooms[this._zoomLevel];
};

p.getRightEdge = function () {
    return this._right;
}

p.panRight = function (update = true) {
    this._right.add(this.pans[this._zoomLevel]);
    if (update)
        this.updateChart();
}

p.panLeft = function (update = true) {
    this._right.subtract(this.pans[this._zoomLevel]);
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
    var rightString = this._right.format(this.dateFormat);
    var leftString = moment.utc(this._right).subtract(this.zooms[this._zoomLevel]).format(this.dateFormat);
    return leftString + ' - ' + rightString + ' - (' + this.zoomLabels[this._zoomLevel] + ')';
}

// CHART MANIPULATION /////////

p.updateChart = function (t) {
    // set viewport on chart
    if (!this._chart) return;

    this._chart.options.scales.xAxes[0].time.min = moment.utc(this._right).subtract(this.zooms[this._zoomLevel]).format();
    this._chart.options.scales.xAxes[0].time.max = this._right.format();
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

module.exports = ChartController;
},{}],3:[function(require,module,exports){
module.exports = {
    getGreeting: function (name) {
        return "Hello, " + name
    }
}
},{}]},{},[1]);
