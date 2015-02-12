var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
	Comment = mongoose.model('Comment'),
	authenticationService = rootRequire('app/services/auth.js');

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
		comments: _.map(issue.comments, function(comment) { return convertMongoComment(comment); })
	}
}

router.param('id', function(req, res, next, id) {
	if (id != undefined) {
		Issue.findById(id, function (err, issue) {
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
		.populate('comments._author')
		.exec(function(err, issuePopulated) {
			res.json(convertMongoIssue(issuePopulated));
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

function changeState(res, user, issue, state, mandatoryComment, optionalComment) {
	issue.state = state;
	issue.comments.push(new Comment( { text: mandatoryComment, _author: user.id }));

	if (optionalComment != undefined) {
		issue.comments.push(new Comment( { text: optionalComment, _author: user.id }));
	}

	issue.save(function (err, issueSaved) {
		reloadAndConvertIssue(res, issueSaved.id);
	});
}

function tagComment(user, issue, comment) {
	var comment = new Comment({ text: comment, _author: user.id, date: Date.now });

	issue.comments.push(comment);
}

var actions = {
	comment: function(req, res, next, comment) {
		var comment = new Comment({ text: comment.text, _author: req.user.id, date: Date.now });

		req.issue.comments.push(comment);

		req.issue.save(function(err, issueSaved) {
			reloadAndConvertIssue(res, issueSaved.id);
		});
	},

	addTags: function(req, res, next, payload) {
		req.issue.tags = _.union(req.issue.tags, payload.tags);

		tagComment(req.user, req.issue, 'Tags added to the issue.');

		req.issue.save(function(err, issueSaved) {
			reloadAndConvertIssue(res, issueSaved.id);
		});
	},

	removeTags: function(req, res, next, payload) {
		req.issue.tags = _.difference(req.issue.tags, payload.tags);

		tagComment(req.user, req.issue, 'Tags removed from the issue.');

		req.issue.save(function(err, issueSaved) {
			reloadAndConvertIssue(res, issueSaved.id);
		});
	},

	replaceTags: function(req, res, next, payload) {
		req.issue.tags = payload.tags;

		tagComment(req.user, req.issue, 'Tags replaced on the issue.');

		req.issue.save(function(err, issueSaved) {
			reloadAndConvertIssue(res, issueSaved.id);
		});
	},

	assign: function(req, res, next, payload) {
		User.findById(payload.assigneeId, function(err, assignee) {
			req.issue._assignee = assignee.id;
			changeState(res, req.user, req.issue, 'assigned', 'The issue has been assigned.', payload.comment);
		});
	},

	ack: function(req, res, next, payload) {
		changeState(res, req.user, req.issue, 'acknowledged', 'The staff has received the issue.', payload.comment);
	},

	start: function(req, res, next, payload) {
		changeState(res, req.user, req.issue, 'in_progress', 'The issue is under investigation.', payload.comment);
	},

	reject: function(req, res, next, payload) {
		changeState(res, req.user, req.issue, 'rejected', 'It seems there is nothing to do there!', payload.comment);
	},

	resolve: function(req, res, next, payload) {
		changeState(res, req.user, req.issue, 'resolved', 'Yeah! Staff is proud to announce that the issue has been solved!', payload.comment);
	}
}

router.route('/:id/actions')
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
