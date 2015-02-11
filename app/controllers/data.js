var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	User = mongoose.model('User'),
	IssueType = mongoose.model('IssueType'),
  Issue = mongoose.model('Issue'),
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

function populateIssues(res) {
	var creationDate = randomDate(new Date(2012, 0, 1), new Date(2015, 6, 1));

	var data = [];
	for (var i = 0; i < 100; i++) {
		data.push({
			description: descriptionsAndComments[randomInt(0, descriptionsAndComments.length)],
			lng: random(minLng, maxLng),
			lat: random(minLat, maxLat),
			state: issueStates[randomInt(0, issueStates.length)],
			updatedOn: creationDate,
			tags: generateTags(creationDate),
			comments: generateComments(creationDate),
			_issueType: issueTypes[randomInt(0, issueTypes.length)].id,
			_owner: citizen[randomInt(0, citizen.length)].id,
			_assignee: staff[randomInt(0, staff.length)].id
		});
	}

	Issue.create(data, function(err) {
		issues = Array.prototype.slice.call(arguments, 1);
		res.status(200).end();
	});
}

function populateIssueTypes(res) {
	var issueTypeData = [
		{ name: "broken streetlight", description: "Light is broken"},
		{ name: "dangerous crossroad", description: "Devil road"},
		{ name: "graffiti", description: "Youngs are evil"}
	];

	IssueType.create(issueTypeData, function(err) {
		issueTypes = Array.prototype.slice.call(arguments, 1);

		populateIssues(res);
	});
}

function populatePeople(res) {
	var firstnames = [ 'Alfred', 'Henri', 'Romain', 'Benoit', 'Alain', 'Alex'];
	var lastnames = [ 'Dupont', 'Dutoit', 'Ducroc', 'Desportes', 'Terieur' ];

	var data = [];
	for (var i = 0; i < 15; i++) {
		data.push({
			firstname: firstnames[randomInt(0, firstnames.length)],
			lastname: lastnames[randomInt(0, lastnames.length)],
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
		Issue.find().remove(function(err) {
			User.find().remove(function(err) {
				IssueType.find().remove(function(err) {
					populatePeople(res);
				});
			});
		});
	})
