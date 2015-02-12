var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  IssueType = mongoose.model('IssueType'),
	authenticationService = rootRequire('app/services/auth.js'),
	pagingAndSortingService = rootRequire('app/services/PagingAndSorting.js');

module.exports = function (app) {
  app.use('/api/issueTypes', router);
};

function convertMongoIssueType(issueType) {
	return {
		id: issueType.id,
		name: issueType.name,
		description: issueType.description
	}
}

router.route('/')
	.get(authenticationService.authenticate)
	.get(pagingAndSortingService.pager)
	.get(pagingAndSortingService.sorter)
	.get(function(req, res, next) {
		pagingAndSortingService.decorate(
			req, IssueType.find()
		)
		.exec(function (err, issueTypes) {
		  if (err) return next(err);
		  res.json(_.map(issueTypes, function(issueType) {
				return convertMongoIssueType(issueType);
			}));
		});
	})

	.post(authenticationService.authenticate)
	.post(authenticationService.authorize([ 'staff' ]))
	.post(function (req, res, next) {
		var issueType = new IssueType({
			name: req.body.name,
			description: req.body.description
		});

		issueType.save(function(err, issueTypeSaved) {
			res.status(201).json(convertMongoIssueType(issueTypeSaved));
		});
	});

router.route('/:id')
	.get(authenticationService.authenticate)
	.get(function(req, res, next) {
		IssueType.findById(req.params.id, function(err, issueType) {
			res.json(convertMongoIssueType(issueType));
		});
	})

	.put(authenticationService.authenticate)
	.put(authenticationService.authorize([ 'staff' ]))
	.put(function(req, res, next) {
		IssueType.findById(req.params.id, function(err, issueType) {
			issueType.name = req.body.name;
			issueType.description = req.body.description;

			issueType.save(function(err, issueTypeSaved) {
				res.json(convertMongoIssueType(issueTypeSaved));
			});
		});
	})

	.delete(authenticationService.authenticate)
	.delete(authenticationService.authorize([ 'staff' ]))
	.delete(function(req, res, next) {
		IssueType.findByIdAndRemove(req.params.id, function(err) {
			res.status(204).end();
		});
	});