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
            borderColor: Color(window.chartColors.orange).alpha(0.5).rgbString()
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