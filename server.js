// requires
const express = require('express'),
    app = express(),
    path = require('path'),
    moment = require('moment');

// const users = require('./users');

// generate some data
function generateDataSet(type = "line", label = "Meditation") {
    var tempData = {
        "type": type,
        "label": label,
        "data": generateTempData(),
        "fill": false,
        "borderColor": "rgb(75, 192, 192)",
        "lineTension": 0
    };
    return tempData;
}

function generateTempData(numDays = 30, missPercentage = 0.3, maxValue = 30) {
    var tempData = [];
    for (var days = -numDays + 1; days <= 0; days++) {
        tempData.push({
            x: relativeDateString(days),
            y: (Math.random() < missPercentage) ? 0 : Math.ceil(Math.random() * maxValue)
        });
    }
    return tempData;
}

function relativeDateString(daysFromNow) {
    return moment().add(daysFromNow, 'd').format('YYYY-MM-DD');
}

//var data = generateDataSet();

//setting the port.
app.set('port', process.env.PORT || 3000);

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

//Adding routes
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

app.get('/api/data', (request, response) => {
    response.json(generateDataSet());
});

var port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Express server started at port ' + port);
});