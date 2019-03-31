(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var module = require('./modules/samplemodule');
var Viewport = require('./modules/viewport');

// set up variables ///////////////

window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};
window.chartColorsArray = [
    /*'#4dc9f6',
    '#f67019',
    '#f53794',
    '#537bc4',
    '#acc236',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba'*/
];

window.getColor = function (i) {
    return window.chartColorsArray[i % window.chartColorsArray.length];
};

var xAxis = {
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
window.xAxis = xAxis;

var yAxis = {
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'Minutes'
    }
};
window.yAxis = yAxis;

var config = {
    type: "bar",
    data: {
        datasets: [{
            type: "line",
            label: "Meditation",
            data: [],
            fill: false,
            pointBackgroundColor: window.chartColors.orange,
            pointBorderColor: window.chartColors.orange,
            backgroundColor: Color(window.chartColors.orange).alpha(0.5).rgbString(),
            borderColor: window.chartColors.orange
        }]
    },
    options: {
        maintainAspectRatio: false,
        title: {
            display: true,
            fontSize: 20,
            text: ''
        },
        layout: {
            padding: 15
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
            xAxes: [xAxis],
            yAxes: [yAxis]
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
window.config = config;

$(() => {
    console.log('main onload');

    var mainChart = new Chart("mainChart", config);
    window.mainChart = mainChart;

    // viewport object
    var viewport = new Viewport(mainChart);
    window.viewport = viewport;

    getData();

    console.log('setting up interactivity');

    $('#getData').click(function () {
        console.log('click getData');
        getData();
    });

    $('#line').click(() => {
        console.log('click line');
        config.data.datasets[0].type = 'line';
        mainChart.update(0);
    });

    $('#bar').click(() => {
        console.log('click bar');
        config.data.datasets[0].type = 'bar';
        mainChart.update(0);
    });

    $('#reset').click(() => {
        mainChart.resetZoom();
    });

    $('#minus').click(() => {
        viewport.zoomOut();
    });

    $('#plus').click(() => {
        viewport.zoomIn();
    });

    $('#left').click(() => {
        viewport.panLeft();
    });

    $('#right').click(() => {
        viewport.panRight();
    });

    $('#showall').click(() => {
        viewport.showAll();
    });

    function getData() {
        console.log('getData');
        $.ajax({
            url: '/api/sets/5ca00f23f968e4b0a2f36e0e/points',
            method: 'GET',
            success: (data) => {
                // format data received
                normalizeDates(data);
                config.data.datasets[0].data = data;

                viewport.updateChart();

                // set viewport
                /*var max = viewport.getRightEdge();
                var params = viewport.getZoomParams();
                mainChart.scales['x-axis-0'].options.time.max = max.format();
                mainChart.scales['x-axis-0'].options.time.min = viewport.getRightEdge().subtract(viewport.getZoomParams()).format();*/
                //xAxis.time.max = max.format();
                //xAxis.time.min = viewport.getRightEdge().subtract(viewport.getZoomParams()).format();
                //config.options.scales.xAxes[0] = xAxis;

                //mainChart.update();
            },

            error: (err) => {
                console.log('Failed');
            }
        });
    }

    function normalizeDates(data) {
        for (var i = 0; i < data.length; i++) {
            var datum = data[i];
            datum.x = moment(datum.x).utc().format('YYYY-MM-DD');
        }
        return data;
    }
});
},{"./modules/samplemodule":2,"./modules/viewport":3}],2:[function(require,module,exports){
module.exports = {
    getGreeting: function (name) {
        return "Hello, " + name
    }
}
},{}],3:[function(require,module,exports){
Viewport = function (chart) {
    this._chart = chart;

    this._right = moment.utc();

    this.setZoomLevel(this.defaultZoomLevel, false);
};

Viewport.prototype.zooms = [{
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

Viewport.prototype.zoomLabels = [
    '1 Year',
    '6 Months',
    '3 Months',
    '1 Month',
    '2 Weeks', 
    '1 Week'
];

Viewport.prototype.pans = [{
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

Viewport.prototype.dateFormat = 'MM/DD/YYYY';

Viewport.prototype.defaultZoomLevel = 3;

Viewport.prototype.setZoomLevel = function (val, update = true) {
    val = Math.max(0, Math.min(val, this.zooms.length - 1));
    this._zoomLevel = val;
    console.log('zoom level: ' + this._zoomLevel);

    if (update)
        this.updateChart();
};

Viewport.prototype.getZoomLevel = function () {
    return this._zoomLevel;
};

Viewport.prototype.zoomIn = function (update = true) {
    this.setZoomLevel(this._zoomLevel + 1, update);
};

Viewport.prototype.zoomOut = function (update = true) {
    this.setZoomLevel(this._zoomLevel - 1, update);
};

Viewport.prototype.getZoomParams = function () {
    return this.zooms[this._zoomLevel];
};

Viewport.prototype.getRightEdge = function () {
    return this._right;
}

Viewport.prototype.panRight = function (update = true) {
    this._right.add(this.pans[this._zoomLevel]);
    if (update)
        this.updateChart();
}

Viewport.prototype.panLeft = function (update = true) {
    this._right.subtract(this.pans[this._zoomLevel]);
    if (update)
        this.updateChart();
}

Viewport.prototype.showAll = function (update = true) {
    var data = this._chart.data.datasets[0].data;
    var first = data[0].x;
    var last = data[data.length - 1].x;
    this._chart.options.scales.xAxes[0].time.min = first;
    this._chart.options.scales.xAxes[0].time.max = last;
    if (update)
        this._chart.update();
}

Viewport.prototype.getRangeString = function () {
    var rightString = this._right.format(this.dateFormat);
    var leftString = moment.utc(this._right).subtract(this.zooms[this._zoomLevel]).format(this.dateFormat);
    return leftString + ' - ' + rightString + ' - (' + this.zoomLabels[this._zoomLevel] + ')';
}

Viewport.prototype.updateChart = function (t) {
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

    console.log(this.getRangeString());
}

module.exports = Viewport;
},{}]},{},[1]);
