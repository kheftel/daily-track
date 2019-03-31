var module = require('./modules/samplemodule');

console.log(module.getGreeting('Kawika'));

$(() => {
    console.log('main onload');

    var config = {
        "type": "bar",
        "data": {
            "datasets": [{
                "type": "line",
                "label": "Meditation",
                "data": [],
                "fill": false,
                "borderColor": "rgb(75, 192, 192)",
                "lineTension": 0
            }]
        },
        "options": {
            maintainAspectRatio: false,
            title: {
                display: false,
                text: 'DailyTrack'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'linear',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    },
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Minutes'
                    }
                }]
            }
        }
    };

    var mainChart = new Chart("mainChart", config);

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

    function getData(e) {
        console.log('getData');
        $.ajax({
            url: '/api/datasets/5ca00f23f968e4b0a2f36e0e/datapoints',
            method: 'GET',
            success: (data) => {
                //console.log(data);
                config.data.datasets[0].data = data;
                mainChart.update();
            },

            error: (err) => {
                console.log('Failed');
            }
        });
    }
});