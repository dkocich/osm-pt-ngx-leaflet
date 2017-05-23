// in server.js
const express = require('express');
var Rollbar = require('rollbar');
var rollbar = new Rollbar('250c0d2caf0f482f8c988eb7100fdc66');
const app = express();

// Since the root/src dir contains our index.html
app.use(express.static(__dirname + '/public/'));

// Use the rollbar error handler to send exceptions to your rollbar account
app.use(rollbar.errorHandler());

// Heroku bydefault set an ENV variable called PORT=443
//  so that you can access your site with https default port.
// Falback port will be 8080; basically for pre-production test in localhost
// You will use $ npm run prod for this
app.listen(process.env.PORT || 8080);