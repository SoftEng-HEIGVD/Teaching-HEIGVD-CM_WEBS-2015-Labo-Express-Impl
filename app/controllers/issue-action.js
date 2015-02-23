var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
	Comment = mongoose.model('Comment'),
	Action = mongoose.model('Action'),
	converterService = require('../services/converter.js'),
	authenticationService = require('../services/auth.js');

module.exports = function (app) {
  app.use('/api/issues', router);
};

router.param('id', function(req, res, next, id) {
	if (id != undefined) {
		Issue
			.findById(id)
			.populate('_actions')
			.exec(function (err, issue) {
				if (err) {
					res.status(404).end();
				}

				req.issue = issue;
				next();
			});
	}
	else {
		res.status(404).end();
	}
});

function reloadAndConvertIssue(res, issueId) {
	Issue
		.findById(issueId)
		.populate('_owner')
		.populate('_assignee')
		.populate('_issueType')
		.populate('_actions')
		.populate('comments._author')
		.exec(function(err, issuePopulated) {
			res.json(converterService.convertIssue(issuePopulated));
		})
}

var STAFF_ACTIONS = [{
	action: 'ack',
	assignee: false
}, {
	action: 'assign',
	assignee: false
}, {
	action: 'start',
	assignee: true
}, {
	action: 'reject',
	assignee: true
}, {
	action: 'resolve',
	assignee: true
}];

var checkActionAuthorizations = function(req, res, next) {
	var action = _.find(STAFF_ACTIONS, function(action) { return action.action == req.body.type; });

	if (action != undefined) {
		if (_.contains(req.user.roles, 'staff')) {
			if (action.assignee) {
				next();
			}
		}
		else {
			res.status(403).end();
		}
	}
	else {
		next();
	}
};

function createAndSaveAction(actionType, issue, user, reason, callback) {
	var action = new Action({
		reason: reason,
		_issue: issue,
		user: user.firstname + ' ' + user.lastname,
		actionType: actionType
	});

	action.save(function(err, actionSaved) {
		issue._actions.push(actionSaved);
		callback();
	});
}

function changeState(actionType, res, user, issue, state, mandatoryComment, payload) {
	issue.state = state;
	issue.comments.push(new Comment( { text: mandatoryComment, _author: user.id }));

	createAndSaveAction(actionType, issue, user, mandatoryComment, function() {
		if (payload !== undefined && payload.comment !== undefined) {
			issue.comments.push(new Comment( { text: payload.comment, _author: user.id }));
		}

		issue.save(function (err, issueSaved) {
			reloadAndConvertIssue(res, issueSaved.id);
		});
	});
}

function tagAction(actionType, user, issue, reason, callback) {
	createAndSaveAction(actionType, issue, user, reason, callback);
}

var actions = {
	comment: function(req, res, next, comment) {
		var comment = new Comment({ text: comment.text, _author: req.user.id, date: Date.now });

		req.issue.comments.push(comment);

		createAndSaveAction('addComment', issue, user, 'Comment added.', function() {
			req.issue.save(function(err, issueSaved) {
				reloadAndConvertIssue(res, issueSaved.id);
			});
		});
	},

	addTags: function(req, res, next, payload) {
		req.issue.tags = _.union(req.issue.tags, payload.tags);

		tagAction('addTags', req.user, req.issue, 'Tags added to the issue.', function() {
			req.issue.save(function(err, issueSaved) {
				reloadAndConvertIssue(res, issueSaved.id);
			});
		});
	},

	removeTags: function(req, res, next, payload) {
		req.issue.tags = _.difference(req.issue.tags, payload.tags);

		tagAction('removeTags', req.user, req.issue, 'Tags removed from the issue.', function() {
				req.issue.save(function(err, issueSaved) {
					reloadAndConvertIssue(res, issueSaved.id);
				});
			}
		);
	},

	replaceTags: function(req, res, next, payload) {
		req.issue.tags = payload.tags;

		tagAction('replaceTags', req.user, req.issue, 'Tags replaced on the issue.', function() {
				req.issue.save(function(err, issueSaved) {
					reloadAndConvertIssue(res, issueSaved.id);
				});
			}
		);

	},

	assign: function(req, res, next, payload) {
		User.findById(payload.assigneeId, function(err, assignee) {
			req.issue._assignee = assignee.id;
			changeState('assign', res, req.user, req.issue, 'assigned', 'The issue has been assigned.', payload);
		});
	},

	ack: function(req, res, next, payload) {
		changeState('ack', res, req.user, req.issue, 'acknowledged', 'The staff has received the issue.', payload);
	},

	start: function(req, res, next, payload) {
		changeState('start', res, req.user, req.issue, 'in_progress', 'The issue is under investigation.', payload);
	},

	reject: function(req, res, next, payload) {
		changeState('reject', res, req.user, req.issue, 'rejected', 'It seems there is nothing to do there!', payload);
	},

	resolve: function(req, res, next, payload) {
		changeState('resolve', res, req.user, req.issue, 'resolved', 'Yeah! Staff is proud to announce that the issue has been solved!', payload);
	}
}

router.route('/:id/actions')
	.get(authenticationService.authenticate)
	.get(authenticationService.authorize([ 'staff' ]))
	.get(function(req, res, next) {
		res.json(_.map(req.issue._actions, function(action) {
			return converterService.convertActionIssue(action);
		}));
	})

	.post(authenticationService.authenticate)
	.post(authenticationService.authorize([ 'citizen', 'staff' ]))
	.post(checkActionAuthorizations)
	.post(function(req, res, next) {
		if (actions[req.body.type] != undefined) {
			actions[req.body.type](req, res, next, req.body.payload)
		}
		else {
			res.status(404).end();
		}
	})
