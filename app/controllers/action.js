var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	Action = mongoose.model('Action'),
	authenticationService = require('../services/auth.js'),
	pagingAndSortingService = require('../services/paging-sorting.js');

module.exports = function (app) {
  app.use('/api/actions', router);
};

function convertMongoAction(action) {
	return {
		id: action.id,
		type: action.actionType,
		user: action.user,
		issueId: action._issue.id,
		actionDate: action.actionDate,
		reason: action.reason
	}
}

router.route('/')
	.get(authenticationService.authenticate)
	.get(authenticationService.authorize([ 'staff' ]))
	.get(pagingAndSortingService.pager)
	.get(pagingAndSortingService.sorter)
	.get(function(req, res, next) {
		pagingAndSortingService.decorate(
			req, Action.find().populate('_issue')
		)
		.exec(function (err, actions) {
			if (err) return next(err);
			res.json(_.map(actions, function(action) {
				return convertMongoAction(action);
			}));
		});
	});
