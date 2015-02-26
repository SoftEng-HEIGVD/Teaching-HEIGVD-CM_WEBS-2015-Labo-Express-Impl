var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
	converterService = require('../services/converter.js'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/users', router);
};

function createUser(firstname, lastname, phone, roles) {
	return new User({
		firstname: firstname,
		lastname: lastname,
		name: firstname + ' ' + lastname,
		phone: phone,
		roles: roles
	});
}

router.route('/')
	.get(authenticationService.authenticate)
	.get(authenticationService.authorize(['staff']))
	.get(pagingAndSortingService.pager)
	.get(pagingAndSortingService.sorter)
	.get(function(req, res, next) {
		pagingAndSortingService.decorate(
			req, User.find()
		)
		.exec(function (err, users) {
		  if (err) return next(err);
		  res.json(_.map(users, function(user) {
				return converterService.convertUser(user);
			}));
		});
	})

	.post(function (req, res, next) {
		User
			.find()
			.where({ name: (req.body.firstname + ' ' + req.body.lastname).toLowerCase() })
			.exec(function(err, userFound) {

				if (userFound === null) {
					var user = createUser(
						req.body.firstname,
						req.body.lastname,
						req.body.phone,
						req.body.roles
					);

					user.save(function(err, userSaved) {
						res.status(201).json(converterService.convertUser(userSaved));
					});
				}
				else {
					res.status(422).json({ message: 'First and last names already taken.' }).end();
				}
			});
	});

router.route('/:id')
	.get(authenticationService.authenticate)
	.get(function(req, res, next) {
		User.findById(req.params.id, function(err, user) {
			res.json(converterService.convertUser(user));
		});
	})

	.put(authenticationService.authenticate)
	.put(authenticationService.authorize([ 'staff' ]))
	.put(function(req, res, next) {
		User.findById(req.params.id, function(err, user) {
			User
				.find()
				.where({ name: (req.body.firstname + ' ' + req.body.lastname).toLowerCase() })
				.exec(function(err, userFound) {
					if (userFound === null || (userFound !== null && userFound.id === user.id)) {
						user.firstname = req.body.firstname;
						user.lastname = req.body.lastname;
						user.name = req.body.firstname + ' ' + req.body.lastname;
						user.phone = req.body.phone;
						user.roles = req.body.roles;

						user.save(function(err, userSaved) {
							res.json(converterService.convertUser(userSaved)).end();
						});
					}
					else {
						res.status(422).json({ message: 'First and last names already taken.'}).end();
					}
				});
		});
	})

	.delete(authenticationService.authenticate)
	.delete(authenticationService.authorize([ 'staff' ]))
	.delete(function(req, res, next) {
		User.findByIdAndRemove(req.params.id, function(err) {
			res.status(204).end();
		});
	});

router.route('logister')
	.post(function(req, res, next) {
		User
			.find()
			.where({ name: (req.body.firstname + ' ' + req.body.lastname).toLowerCase() })
			.exec(function(err, userFound) {
				if (err) return next(err);

				if (userFound !== null) {
					return res.json({ userId: userFound.id }).end();
				}
				else {
					var user = createUser(req.body.firstname, req.body.lastname, 'none', [ 'citizen' ]);

					user.save(function(err, userSaved) {
						if (err) return next(err);

						return res.json({ userId: userSaved.id }).end();
					});
				}
			});
	});