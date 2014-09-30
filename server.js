var express = require('express');
var fs = require('fs');

var app = express();
var port = process.env.port || 8080;

// Serve up files in public folder
app.use('/', express.static(__dirname + '/public'));

// must serve up ejs files individually for Azure to accept in deployment
app.get('/ejs_templates/:ejsTemplate', function(req, res) {
  // file server
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(__dirname+'/public/ejs_templates/' +  req.params.ejsTemplate + '.ejs'));
});

// The router for the API
var router = express.Router();


// Set root route for app's data
app.use('/api', router);

app.listen(port);

console.log('Listening on port: ', port);

// for ServerSpec.js to work must export app
module.exports = app;