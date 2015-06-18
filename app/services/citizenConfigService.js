var
	_ = require('underscore'),
	fs = require('fs'),
	config = require('../../config/config'),
	ifluxClient = require('iflux-node-client');

var citizenConfig = {};

function initIfluxClients() {
	_.each(citizenConfig, function (conf, instanceId) {
		initIfluxClient(instanceId, conf);
	});
}
function initIfluxClient(instanceId, conf) {
	conf.client = new ifluxClient.Client(config.iflux.url, instanceId);
}

module.exports = {
	load: function() {
		if (config.app.storageEnabled) {
			fs.readFile(config.app.storagePath + '/cities.json', function(err, data) {
				if (err) {
					console.log(err);
				}
				else {
					citizenConfig = JSON.parse(data);
					initIfluxClients();
				}
			});
		}
	},

	save: function() {
		if (config.app.storageEnabled) {
			var configToSave = _.reduce(citizenConfig, function(memo, config, key) {
				memo[key] = { conf: config.conf };
				return memo;
			}, {});

			fs.writeFile(config.app.storagePath + '/cities.json', JSON.stringify(configToSave), function (err) {
				if (err) {
					console.log(err);
				}
			});
		}
	},

	upsert: function(instanceId, config) {
		citizenConfig[instanceId] = { conf: config };
		initIfluxClient(instanceId, citizenConfig[instanceId]);
		this.save();
	},

	get: function(zip) {
		// Retrieve all the configs that are available for the zip
		var matched = _.filter(citizenConfig, function(config) {
			return config.conf.all || _.contains(config.conf.zipCodes, zip);
		});

		// If there is at least one config
		if (matched.length > 0) {
			return matched;
		}

		// Otherwise, try to find a default one
		else {
			var res = _.find(citizenConfig, function(config) {
				return config.conf.default;
			});

			if (res) {
				return [ res ];
			}
		}

		return [];
	}
};