var
	_ = require('underscore'),
	q = require('q'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
	Action = mongoose.model('Action'),
	Comment = mongoose.model('Comment');

module.exports = function (app) {
  app.use('/api/data', router);
};

function random (low, high) {
    return Math.random() * (high - low) + low;
}

function randomInt (low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

var firstnames = [ 'Alfred', 'Henri', 'Romain', 'Benoit', 'Alain', 'Alex', 'Baptiste', 'Gabriel', 'Valentin', 'Guy', 'Pierre', 'Nico'];
var lastnames = [ 'Dupont', 'Dutoit', 'Ducroc', 'Desportes', 'Terieur', 'Combes', 'Tartanpion', 'Favre', 'Cornuz', 'Bolomey' ];

var descriptionsAndComments = [
	'Morbi a odio cursus, finibus lorem ut, pellentesque elit.',
	'Nunc sollicitudin lorem at dolor placerat, eget ornare erat fringilla.',
	'Sed eget ipsum sit amet lacus dictum porttitor at facilisis velit.',
	'Integer at metus vitae erat porta pellentesque.',
	'Pellentesque iaculis ante vestibulum dolor finibus hendrerit.',
	'Mauris tempus orci quis orci lacinia cursus.',
	'Nam semper ligula quis nisl egestas, at pellentesque nunc tincidunt.',
	'Integer venenatis justo ac urna accumsan, eget hendrerit ligula eleifend.',
	'Ut sagittis ipsum sed nisl ultrices rutrum.',
	'Proin pretium lacus nec lectus congue, a finibus elit consequat.',
	'Sed id ligula semper, auctor metus et, mattis tortor.',
	'Aenean non massa quis urna pellentesque pellentesque in nec ex.',
	'Vestibulum non erat venenatis, finibus lorem ac, eleifend eros.',
	'Proin ac mi et turpis volutpat facilisis id eget est.',
 	'Pellentesque mattis quam tincidunt sem rhoncus finibus.'
];

var tags = ['Proin', 'Orci', 'Egestas', 'Lobortis', 'Quam', 'Non', 'Posuere', 'Lorem', 'Etiam'];

var issueStates = [
	'created',
	'acknowledged',
	'assigned',
	'in_progress',
	'solved',
	'rejected'
];

var actionTypes = [
	'addComment',
	'addTags',
	'replaceTags',
	'removeTags',
	'assign',
	'ack',
	'reject',
	'start',
	'resolve'
];

var issueTypeData = [
	{ _idx_: 0, code: "bsl", name: "broken streetlight", description: "Light is broken"},
	{ _idx_: 1, code: "dcr", name: "dangerous crossroad", description: "Devil road"},
	{ _idx_: 2, code: "grf", name: "graffiti", description: "Youngs are evil"}
];

var urls = {
	0: [
		'http://cdn2.hubspot.net/hub/372659/file-647474867-jpg/blog-files/lightpole2.jpg?t=1424816062643',
		'http://seeclickfix.com/files/issue_images/0008/5245/2012-08-01_10.07.37.jpg',
		'http://www.jolind.com/swenjohncom/Images/Cuba/INFRO2.JPG'
	],
	1: [
		'http://www.downvids.net/video/bestimages/img-dangerous-crossroad-916.jpg',
		'https://departmentfortransport.files.wordpress.com/2014/02/bb2-vzyimaaw3cx-large.jpg',
		'http://i.imgur.com/OkwKGNh.jpg'
	],
	2: [
		'http://all-that-is-interesting.com/wordpress/wp-content/uploads/2013/02/Moss-Graffiti-And-Regular-Graffiti.jpg',
		'http://fc01.deviantart.net/fs70/f/2012/088/0/e/surreal__graffiti_alley_by_darkphoenix36-d4ucmlj.jpg',
		'http://cdn.wonderfulengineering.com/wp-content/uploads/2014/09/graffiti-wallpaper-8.jpg'
	]
}

var people = null;
var citizen = null;
var staff = null;
var issueTypes = null;
var issues = null;

var minLat = 46.766129;
var maxLat = 46.784234;
var minLng = 6.622009;
var maxLng = 6.651878;

function generateRoles() {
	var roles = [[ 'citizen' ], [ 'staff' ], [ 'citizen', 'staff' ]];
	return roles[randomInt(0, 3)];
}

function generateTags() {
	var data = [];
	for (var i = 0; i < randomInt(1, 10); i++) {
		data.push(tags[randomInt(0, tags.length)]);
	}

	return _.uniq(data);
}

function generateComments(creationDate) {
	var data = [];

	for (var i = 0; i < randomInt(1, 25); i++) {
		data.push(new Comment({
			text: descriptionsAndComments[randomInt(0, descriptionsAndComments.length)],
			postedOn: randomDate(creationDate, new Date(2015, 6, 1)),
			_author: people[randomInt(0, people.length)].id
		}));
	}

	return data;
}

function generateActions(creationDate, issue) {
	var deferred = q.defer();

	var actions = [];

	for (var i = 0; i < randomInt(1, 15); i++) {
		var user = people[randomInt(0, people.length)];

		var action = new Action({
			user: user.firstname + ' ' + user.lastname,
			actionDate: randomDate(creationDate, new Date(2015, 6, 1)),
			actionType: actionTypes[randomInt(0, actionTypes.length)],
			reason: descriptionsAndComments[randomInt(0, descriptionsAndComments.length)],
			_issue: issue
		});

		actions.push(action);
	}

	Action.create(actions, function(err) {
		var actionsCreated = Array.prototype.slice.call(arguments, 1);
		issue._actions = actionsCreated;
		deferred.resolve(issue);
	})

	return deferred.promise;
}

function updateIssue(issue) {
	var deferred = q.defer();

	issue.save(function(err, issueSaved) {
		deferred.resolve();
	});

	return deferred.promise;
}

function populateIssues(res) {
	var creationDate = randomDate(new Date(2012, 0, 1), new Date(2015, 6, 1));

	var data = [];
	for (var i = 0; i < 100; i++) {
		var issueType = issueTypes[randomInt(0, issueTypes.length)];
		var randUrls = urls[_.where(issueTypeData, { name: issueType.name })[0]._idx_]

		data.push({
			description: descriptionsAndComments[randomInt(0, descriptionsAndComments.length)],
			lng: random(minLng, maxLng),
			lat: random(minLat, maxLat),
			state: issueStates[randomInt(0, issueStates.length)],
			imageUrl: randUrls[randomInt(0, randUrls.length)],
			createdOn: creationDate,
			updatedOn: creationDate,
			tags: generateTags(creationDate),
			comments: generateComments(creationDate),
			_issueType: issueType.id,
			_owner: citizen[randomInt(0, citizen.length)].id,
			_assignee: staff[randomInt(0, staff.length)].id
		});
	}

	Issue.create(data, function(err) {
		var issues = Array.prototype.slice.call(arguments, 1);

		var actionPromises = [];
		var issuesUpdated = [];
		for (var i = 0; i < issues.length; i++) {
			var actionPromise = generateActions(creationDate, issues[i]);

			actionPromise.then(function(issue) {
				issuesUpdated.push(issue);
			});

			actionPromises.push(actionPromise);
		}

		var issuePromises = [];

		q
			.all(actionPromises)
			.then(function(issues) {
				var issuePromises = [];
				for (var j = 0; j < issues.length; j++) {
					issuePromises = updateIssue(issues[j++]);
				}
			})
			.then(
				q
					.all(issuePromises)
					.then(function() {
						res.status(200).end();
					})
			);
	});
}

function populateIssueTypes(res) {
	IssueType.create(issueTypeData, function(err) {
		issueTypes = Array.prototype.slice.call(arguments, 1);

		populateIssues(res);
	});
}

function populatePeople(res) {
	var takenNames = [];
	var data = [];
	for (var i = 0; i < 15; i++) {
		var firstname;
		var lastname;
		var name;

		// Make sure each first and last name are unique
		for (;;) {
			firstname = firstnames[randomInt(0, firstnames.length)];
			lastname = lastnames[randomInt(0, lastnames.length)];
			name = (firstname + ' ' + lastname).toLowerCase();

			if (!_.contains(takenNames, name)) {
				takenNames.push(name);
				break;
			}
		}

		data.push({
			firstname: firstname,
			lastname: lastname,
			name: name,
			phone: '+' + randomInt(1000000, 10000000),
			roles: generateRoles()
		});
	}

	User.create(data, function(err) {
		var usersCreated = Array.prototype.slice.call(arguments, 1);

		people = usersCreated;

		citizen = _.where(usersCreated, function(user) {
			return _.contains(user.roles, 'citizen');
		});

		staff = _.where(usersCreated, function(user) {
			return _.contains(user.roles, 'staff');
		});

		populateIssueTypes(res);
	})
}

router.route('/populate')
	.post(function(req, res, next) {
		Action.find().remove(function(err) {
			Issue.find().remove(function (err) {
				User.find().remove(function (err) {
					IssueType.find().remove(function (err) {
						populatePeople(res);
					});
				});
			});
		});
	})
