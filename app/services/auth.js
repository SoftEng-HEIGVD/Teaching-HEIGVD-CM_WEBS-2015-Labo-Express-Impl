var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');

function authenticate (headerName, req, res, next) {
}

module.exports = {
	authenticate: function(req, res, next) {
		var userId = req.headers['x-user-id'];

		if (userId != undefined) {
			User.findById(userId, function (err, user) {
				if (err || user == null) {
					res.status(401).end();
				}

				if (user.roles.length > 0) {
					req.user = user;
					next();
				}
				else {
					res.status(403).end();
				}
			});
		}
		else {
			res.status(401).end();
		}
	},

	authorize: function(roles) {
	 	return function(req, res, next) {
			if (req.user != undefined) {
				if (_.isArray(roles)) {
					return _.intersection(roles, req.user.roles).length > 0;
				}
				else {
					return _.contains(req.user.roles, roles);
				}
			}
			else {
				res.status(403).end();
			}
		};
	}
}