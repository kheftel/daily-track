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

//Binding to localhost://3000
app.listen(3000, () => {
    console.log('Express server started at port 3000');
});