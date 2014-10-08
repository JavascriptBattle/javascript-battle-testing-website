var express = require('express');
var fs = require('fs');

var app = express();
var port = process.env.port || 8080;

// Serve up files in public folder
app.use('/', express.static(__dirname + '/public'));

// The router for the API
var router = express.Router();

// Set root route for app's data
app.use('/api', router);

app.listen(port);

console.log('Listening on port: ', port);
