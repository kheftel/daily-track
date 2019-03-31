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