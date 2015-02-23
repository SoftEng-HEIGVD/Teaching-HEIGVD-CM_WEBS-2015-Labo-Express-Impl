var
	config = require('../../config/config.js'),
	ifluxClient = require('iflux-node-client');

function notifyEvent(event) {
	var client = new ifluxClient.Client(config.iflux.url);

	client.notifyEvent(event);
}

module.exports = {
	notifyAction: function(action, issue) {
		notifyEvent(
			new ifluxClient.Event(
				'/sc/actionEvent', {
					type: action.actionType,
					reason: action.reason,
					user: action.user,
					issueId: issue.id,
					issue: issue.description,
					date: new Date()
				}
			)
		);
	}
}