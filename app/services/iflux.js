var
	_ = require('underscore'),
	domain = require('domain'),
	d = domain.create(),
	config = require('../../config/config.js'),
	ifluxClient = require('iflux-node-client'),
	citizenConfigService = require('./citizenConfigService');

d.on('error', function(err) {
	console.log("Unable to send event to iFLUX.");
	console.log(err);
});

function notifyEvents(zip, events) {
	d.run(function() {
		var confs = citizenConfigService.get(zip);

		if (confs) {
			_.each(confs, function(conf) {
				if (_.isArray(events)) {
					console.log("Notify %s event%s", events.length, events.length > 1 ? 's' : '');
					conf.client.notifyEvents(events);
				}
				else {
					console.log("Notify 1 event");
					conf.client.notifyEvent(events);
				}
			});
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
		lat: issue.lat,
		lng: issue.lng,
		createdOn: issue.createdOn,
		updatedOn: issue.updatedOn
	};
}

function createActionEvent(issue, action) {
	return {
		type: action.actionType,
		reason: action.reason,
		user: action.user,
		issueId: issue.id,
		issue: issue.description,
		state: issue.state,
		date: issue.updatedOn
	};
}

var changeStateActions = [ 'assign', 'ack', 'start', 'reject', 'resolve' ];

module.exports = {
	notifyAction: function(action, issue) {
		if (!config.iflux.enabled) {
			return
		}

		var events = [];

		events.push(new ifluxClient.Event(config.app.eventTypes.action, createActionEvent(issue, action)));

		if (_.contains(changeStateActions, action.actionType)) {
			events.push(new ifluxClient.Event(config.app.eventTypes.status, createIssueEvent(issue)));
		}

		notifyEvents(issue.zip, events);
	},

	notifyIssue: function(issue) {
		if (config.iflux.enabled) {
			notifyEvents(issue.zip, new ifluxClient.Event(config.app.eventTypes.issue, createIssueEvent(issue)));
		}
	}
}