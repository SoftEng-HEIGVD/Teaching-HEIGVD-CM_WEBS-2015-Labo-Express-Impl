var
	_ = require('underscore'),
	config = require('../../config/config.js'),
	ifluxClient = require('iflux-node-client');

function notifyEvent(events) {
	var client = new ifluxClient.Client(config.iflux.url, 'smartCity/citizenEngagement');

	if (_.isArray(events)) {
		client.notifyEvents(events);
	}
	else {
		client.notifyEvent(events);
	}
}

var changeStateActions = [ 'assign', 'ack', 'start', 'reject', 'resolve' ];

module.exports = {
	notifyAction: function(action, issue) {
		var events = [];

		events.push(
				new ifluxClient.Event(
				'actionEvent', {
					type: action.actionType,
					reason: action.reason,
					user: action.user,
					issueId: issue.id,
					issue: issue.description,
					state: issue.state,
					date: issue.updatedOn
				}
			)
		);

		if (_.findIndex(changeStateActions, action.actionType) >= 0) {
			events.push(
				new ifluxClient.Event(
					'issueStateChanged', {
						issueId: issue.id,
						imageUrl: issue.imageUrl,
						creator: user.firstname + ' ' + user.lastname,
						description: issue.description,
						state: issue.state,
						where: {
							lat: issue.lat,
							lng: issue.lng
						},
						date: issue.createdOn
					}
				)
			)
		}
	},

	notifyIssue: function(issue, user) {
		notifyEvent(
			new ifluxClient.Event(
				'issueCreated', {
					issueId: issue.id,
					imageUrl: issue.imageUrl,
					creator: user.firstname + ' ' + user.lastname,
					description: issue.description,
					state: issue.state,
					where: {
						lat: issue.lat,
						lng: issue.lng
					},
					date: issue.createdOn
				}
			)
		);
	}
}