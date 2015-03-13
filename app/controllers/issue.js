var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
	converterService = require('../services/converter.js'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/issues', router);
};

function decorate(query) {
	return query
		.populate('_issueType')
		.populate('_owner')
		.populate('_assignee')
		.populate('comments._author')
		.populate('_actions');
}

router.route('/')
	.get(authenticationService.authenticate)
	.get(pagingAndSortingService.pager)
	.get(pagingAndSortingService.sorter)
	.get(function(req, res, next) {
		pagingAndSortingService.decorate(
			req, decorate(Issue.find())
		)
		.exec(function (err, issues) {
			if (err) return next(err);
			res.json(_.map(issues, function(issue) { return converterService.convertIssue(issue); }));
		});
	})

	.post(authenticationService.authenticate)
	.post(function (req, res, next) {
		var issue = new Issue({
			description: req.body.description,
			lat: req.body.lat,
			lng: req.body.lng,
			imageUrl: req.body.imageUrl,
			state: 'created',
			_issueType: req.body.issueTypeId,
			_owner: req.user
		});

		issue.save(function(err, issueSaved) {
			Issue.populate(issueSaved, '_issueType _owner', function(err, issuePopulated) {
				res.status(201).json(converterService.convertIssue(issuePopulated));
			})
		});
	});

router.route('/search')
	.post(authenticationService.authenticate)
	.post(pagingAndSortingService.pager)
	.post(pagingAndSortingService.sorter)
	.post(function(req, res, next) {
		pagingAndSortingService.decorate(
			req, decorate(Issue.find()).where(req.body)
		)
		.exec(function(err, issues) {
			res.json(_.map(issues, function(issue) { return converterService.convertIssue(issue); }));
		});
	});

router.route('/:id')
	.get(authenticationService.authenticate)
	.get(function(req, res, next) {
		decorate(
			Issue.findById(req.params.id)
		)
		.exec(function(err, issue) {
			res.json(converterService.convertIssue(issue));
		});
	})

	.put(authenticationService.authenticate)
	.put(authenticationService.authorize([ 'staff' ]))
	.put(function(req, res, next) {
		decorate(
			Issue.findById(req.params.id)
		)
		.exec(function(err, issue) {
			issue.description = req.body.description;
			issue.lat = req.body.lat;
			issue.lng = req.body.lng;
			issue.imageUrl = req.body.imageUrl;
			issue._issueType = req.body.issueTypeId;

			issue.save(function(err, issueSaved) {
				res.json(converterService.convertIssue(issueSaved));
			});
		});
	})

	.delete(authenticationService.authenticate)
	.delete(authenticationService.authorize([ 'staff' ]))
	.delete(function(req, res, next) {
		Issue.findByIdAndRemove(req.params.id, function(err) {
			res.status(204).end();
		});
	})
