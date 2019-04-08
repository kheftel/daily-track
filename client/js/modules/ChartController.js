ChartController = function (canvas) {
    // copy config
    this._config = JSON.parse(JSON.stringify(p.defaultConfig));

    this._chart = new Chart(canvas, this._config);
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

// INTERNALS
p.defaultXAxis = {
    type: 'time',
    time: {
        minUnit: 'day',
        tooltipFormat: 'MM/DD/YYYY'
    },
    distribution: 'linear',
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'no data'
    },
};

p.defaultYAxis = {
    display: true,
    scaleLabel: {
        display: true,
        labelString: 'no data'
    }
};

p.defaultConfig = {
    type: "line",
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