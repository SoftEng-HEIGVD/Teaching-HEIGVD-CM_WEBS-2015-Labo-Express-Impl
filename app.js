var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose');

global.rootRequire = function(name) {
	if (__dirname.indexOf("app") > -1) {
		return require(__dirname + '/' + name);
	}
	else {
		return require(__dirname + '/app/' + name)
	}
}

mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
var app = express();

require('./config/express')(app, config);

app.listen(config.port);

