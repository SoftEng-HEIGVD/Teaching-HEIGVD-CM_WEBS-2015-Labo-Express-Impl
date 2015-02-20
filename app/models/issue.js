var
	mongoose = require('mongoose'),
  Schema = mongoose.Schema,
	CommentSchema = mongoose.model('Comment').schema;


var Issue = new Schema({
  description: String,
	lng: String,
	lat: String,
	state: String,
	tags: [ String ],
	updatedOn: { type: Date, default: Date.now },
	comments: [ CommentSchema ],
	_actions: [ { type: Schema.Types.ObjectId, ref: 'Action' } ],
	_issueType: { type: Schema.Types.ObjectId, ref: 'IssueType' },
	_owner: { type: Schema.Types.ObjectId, ref: 'User' },
	_assignee: { type: Schema.Types.ObjectId, ref: 'User' }
});

Issue.pre('save', function(next) {
	this.updatedOn = new Date();
	next();
});

mongoose.model('Issue', Issue);