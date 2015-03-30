var
	_ = require('underscore'),
	mongoose = require('mongoose');


function convertUserForIssue(user) {
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

function convertAction(action, complete) {
	var actionTo = {
		id: action.id,
		type: action.actionType,
		user: action.user,
		actionDate: action.actionDate,
		reason: action.reason
	}

	if (complete) {
		actionTo.issueId = action._issue.id;
	}

	return actionTo;
}

function convertComment(comment) {
	if (comment != null) {
		return {
			id: comment.id,
			text: comment.text,
			postedOn: comment.postedOn,
			author: convertUserForIssue(comment._author)
		}
	}
	else {
		return null;
	}
}

function convertIssueType(issueType) {
	if (issueType != null) {
		return {
			id: issueType.id,
			code: issueType.code,
			name: issueType.name,
			description: issueType.description
		};
	}
	else {
		return null;
	}
}

function convertIssue(issue, ownerData) {
	var issueConverted = {
		id: issue.id,
		description: issue.description,
		lat: issue.lat,
		lng: issue.lng,
		imageUrl: issue.imageUrl,
		createdOn: issue.createdOn,
		updatedOn: issue.updatedOn,
		state: issue.state,
		tags: issue.tags,
		issueType: convertIssueType(issue._issueType),
		assignee: convertUserForIssue(issue._assignee),
		comments: _.map(issue.comments, function(comment) { return convertComment(comment); }),
		actions: _.map(issue._actions, function(action) { return convertAction(action, false); })
	}

	if (ownerData) {
		issueConverted.owner = convertUserForIssue(issue._owner);
	}

	return issueConverted;
}

module.exports = {
	convertUser: function(user) {
		return {
			id: user.id,
			firstname: user.firstname,
			lastname: user.lastname,
			phone: user.phone,
			roles: user.roles
		}
	},

	convertIssueType: function (issueType) {
		return convertIssueType(issueType);
	},

	convertAction: function (action) {
		return convertAction(action, true);
	},

	convertActionIssue: function(action) {
		return convertAction(action, false);
	},

	convertIssue: function(issue) {
		return convertIssue(issue, true);
	},

	convertUserIssue: function(issue) {
		return convertIssue(issue, true);
	}
}