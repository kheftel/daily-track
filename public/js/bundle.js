(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Minutes'
                    }
                }]
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x'
                    }
                }
            }
        }
    };

    window.config = config;

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

    $('#reset').click(() => {
        mainChart.resetZoom();
    });

    function getData(e) {
        console.log('getData');
        $.ajax({
            url: '/api/sets/5ca00f23f968e4b0a2f36e0e/points',
            method: 'GET',
            success: (data) => {
                // format data received
                normalizeDates(data);
                config.data.datasets[0].data = data;
                mainChart.update();
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
},{"./modules/samplemodule":2}],2:[function(require,module,exports){
module.exports = {
    getGreeting: function (name) {
        return "Hello, " + name
    }
}
},{}]},{},[1]);
