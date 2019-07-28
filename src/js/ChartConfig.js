// update a bunch of ChartJS global defaults
var defaults = Chart.defaults.global;
defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.defaultFontFamily = '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

// animation/performance
defaults.animation.duration = 0;                // general update animation duration
defaults.hover.animationDuration = 0;           // duration of animations when hovering an item
defaults.responsiveAnimationDuration = 0;       // animation duration after a resize
defaults.elements.line.tension = 0;             // disables bezier curves

// layout
defaults.layout.padding = 0;

// legend
defaults.legend.display = false;
defaults.legend.position = 'top';
defaults.legend.labels.padding = 8;
defaults.legend.labels.usePointStyle = true;
defaults.legend.labels.fontColor = 'white';

// title styling
defaults.title.display = false;
defaults.title.fontColor = 'white';
defaults.title.fontSize = 16;
defaults.title.padding = 4;

// point/bar styling
defaults.elements.point.radius = 5;
defaults.elements.point.hoverRadius = 10;
defaults.elements.point.hitRadius = 10;
defaults.elements.rectangle.borderWidth = 2;

// time axes (horizontal)
Chart.scaleService.updateScaleDefaults('time', {
    offset: true,
    minUnit: 'day',
    displayFormats: {
        day: 'M/D',
        week: 'M/D',
        month: 'MMM',
        quarter: 'MMM YYYY'
    },
    gridLines: {
        color: 'rgba(255, 255, 255, 0.2)',
        drawTicks: false,
        drawBorder: false
    },
    ticks: {
        fontColor: 'white',
        source: 'labels', //default 'auto'
        maxRotation: 0,
        minRotation: 0,
        autoSkip: true,
        padding: 5,
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

// linear axes (vertical)
Chart.scaleService.updateScaleDefaults('linear', {
    display: true,
    ticks: {
        fontColor: 'white',
        padding: 5,
        mirror: false
    },
    gridLines: {
        color: 'rgba(255, 255, 255, 0.2)',
        zeroLineColor: 'rgba(255, 255, 255, 0.2)',
        drawTicks: false,
        drawBorder: true
    },
    scaleLabel: {
        display: false,
        fontColor: 'white',
        labelString: 'no data'
    },
});

// axes can be customized including ticks here: https://www.chartjs.org/docs/latest/axes/#callbacks
// chart plugin info: https://www.chartjs.org/docs/latest/developers/plugins.html

ChartConfig = function() {

};

ChartConfig.today = moment().startOf('day');

ChartConfig.zoomData = {
    "week": {
        label: 'Week',
        unit: 'day',
        viewport: {
            'days': -7
        },
        labelStart: {
            'days': -180
        },
        labelIncrement: {
            'days': 1
        },
        numLabels: 360,
        labels: []
    },
    "month": {
        label: 'Month',
        unit: 'week',
        viewport: {
            'months': -1
        },
        labelStart: {
            'weeks': -52
        },
        labelIncrement: {
            'weeks': 1
        },
        numLabels: 104,
        labels: []
    },
    "3month": {
        label: '3 Months',
        unit: 'month',
        viewport: {
            'months': -3
        },
        labelStart: {
            'months': -24
        },
        labelIncrement: {
            'months': 1
        },
        numLabels: 48,
        labels: []
    },
    "6month": {
        label: '6 Month',
        unit: 'month',
        viewport: {
            'months': -6
        },
        labelStart: {
            'months': -24
        },
        labelIncrement: {
            'months': 1
        },
        numLabels: 48,
        labels: []
    },
    "year": {
        label: 'Year',
        unit: 'quarter',
        viewport: {
            'years': -1
        },
        labelStart: {
            'quarters': -12
        },
        labelIncrement: {
            'quarters': 1
        },
        numLabels: 24,
        labels: []
    }
};

var i, k;
for (var k in ChartConfig.zoomData) {
    var data = ChartConfig.zoomData[k];
    var label = moment(ChartConfig.today).startOf(data.unit).add(data.labelStart);
    for (i = 0; i < data.numLabels; i++) {
        data.labels.push(label.format('YYYY-MM-DD'));
        label.add(data.labelIncrement);
    }
}
