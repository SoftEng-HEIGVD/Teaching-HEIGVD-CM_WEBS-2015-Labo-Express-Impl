var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
  IssueType = mongoose.model('IssueType'),
	converterService = require('../services/converter.js'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/issueTypes', router);
};

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
				return converterService.convertIssueType(issueType);
			}));
		});
	})

	.post(authenticationService.authenticate)
	.post(authenticationService.authorize([ 'staff' ]))
	.post(function (req, res, next) {
		var issueType = new IssueType({
			code: req.body.code,
			name: req.body.name,
			description: req.body.description
		});

		issueType.save(function(err, issueTypeSaved) {
			res.status(201).json(converterService.convertIssueType(issueTypeSaved));
		});
	});

router.route('/:id')
	.get(authenticationService.authenticate)
	.get(function(req, res, next) {
		IssueType.findById(req.params.id, function(err, issueType) {
			res.json(converterService.convertIssueType(issueType));
		});
	})

	.put(authenticationService.authenticate)
	.put(authenticationService.authorize([ 'staff' ]))
	.put(function(req, res, next) {
		IssueType.findById(req.params.id, function(err, issueType) {
			issueType.code = req.body.code;
			issueType.name = req.body.name;
			issueType.description = req.body.description;

			issueType.save(function(err, issueTypeSaved) {
				res.json(converterService.convertIssueType(issueTypeSaved));
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