var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/issues', router);
};

function convertMongoUser(user) {
	if (user != null) {
		return {
			id: user.id,
			name: user.firstname + ' ' + user.lastname
		};
	}
	else {
		return null;
	}
}

function convertMongoAction(action) {
	return {
		id: action.id,
		type: action.actionType,
		user: action.user,
		actionDate: action.actionDate,
		reason: action.reason
	}
}

function convertMongoComment(comment) {
	if (comment != null) {
		return {
			id: comment.id,
			text: comment.text,
			postedOn: comment.postedOn,
			author: convertMongoUser(comment._author)
		}
	}
	else {
		return null;
	}
}

function convertMongoIssueType(issueType) {
	if (issueType != null) {
		return {
			id: issueType.id,
			name: issueType.name
		};
	}
	else {
		return null;
	}
}

function convertMongoIssue(issue) {
	return {
		id: issue.id,
		description: issue.description,
		lat: issue.lat,
		lng: issue.lng,
		updatedOn: issue.updatedOn,
		state: issue.state,
		tags: issue.tags,
		issueType: convertMongoIssueType(issue._issueType),
		owner: convertMongoUser(issue._owner),
		assignee: convertMongoUser(issue._assignee),
		comments: _.map(issue.comments, function(comment) { return convertMongoComment(comment); }),
		actions: _.map(issue._actions, function(action) { return convertMongoAction(action); })
	}
}

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
			res.json(_.map(issues, function(issue) { return convertMongoIssue(issue); }));
		});
	})

	.post(authenticationService.authenticate)
	.post(authenticationService.authorize([ 'citizen' ]))
	.post(function (req, res, next) {
		var issue = new Issue({
			description: req.body.description,
			lat: req.body.lat,
			lng: req.body.lng,
			state: 'created',
			_issueType: req.body.issueTypeId,
			_ownerId: req.user.id
		});

		issue.save(function(err, issueSaved) {
			Issue.populate(issueSaved, '_issueType', function(err, issuePopulated) {
				res.status(201).json(convertMongoIssue(issuePopulated));
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
			res.json(_.map(issues, function(issue) { return convertMongoIssue(issue); }));
		});
	});

router.route('/:id')
	.get(authenticationService.authenticate)
	.get(function(req, res, next) {
		decorate(
			Issue.findById(req.params.id)
		)
		.exec(function(err, issue) {
			res.json(convertMongoIssue(issue));
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

			issue.save(function(err, issueSaved) {
				res.json(convertMongoIssue(issueSaved));
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
