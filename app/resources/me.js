var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	Issue = mongoose.model('Issue'),
	converterService = require('../services/converter.js'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/me', router);
};

router.route('/issues')
	.get(authenticationService.authenticate)
	.get(pagingAndSortingService.pager)
	.get(pagingAndSortingService.sorter)
	.get(function(req, res, next) {
		Issue
			.find()
			.populate('_assignee _issueType _actions comments._author _owner')
			.where( { _owner: req.user.id })
			.exec(function(err, issues) {
				res.json(_.map(issues, function(issue) { return converterService.convertUserIssue(issue); }));
			});
	});
