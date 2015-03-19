var
	_ = require('underscore'),
	domain = require('domain'),
	d = domain.create(),
	config = require('../../config/config.js'),
	ifluxClient = require('iflux-node-client');

d.on('error', function(err) {
	console.log("Unable to send event to iFLUX.");
	console.log(err);
});

function notifyEvent(events) {
	var client = new ifluxClient.Client(config.iflux.url, 'smartCity/citizenEngagement');

	d.run(function() {
		if (_.isArray(events)) {
			console.log("Notify %s events", events.length)
			client.notifyEvents(events);
		}
		else {
			console.log("Notify 1 event");
			client.notifyEvent(events);
		}
	});
}

function createIssueEvent(issue) {
	return {
		issueId: issue.id,
		imageUrl: issue.imageUrl,
		creator: issue._owner.firstname + ' ' + issue._owner.lastname,
		description: issue.description,
		state: issue.state,
		issueTypeCode: issue._issueType.code,
		where: {
			lat: issue.lat,
			lng: issue.lng
		},
		createdOn: issue.createdOn,
		updatedOn: issue.updatedOn
	};
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

		if (_.contains(changeStateActions, action.actionType)) {
			events.push(new ifluxClient.Event('issueStateChanged', createIssueEvent(issue)));
		}

		notifyEvent(events);
	},

	notifyIssue: function(issue) {
		notifyEvent(new ifluxClient.Event('issueCreated', createIssueEvent(issue)));
	}
}