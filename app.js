// requires
const express = require('express'),
    app = express(),
    path = require('path')

// const users = require('./users');

//setting the port.
app.set('port', process.env.PORT || 3000);

// serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

//Adding routes
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

/*app.get('/users', (request, response) => {
    response.json(users);
});*/

var port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Express server started at port port');
});