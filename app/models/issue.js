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
	_issueType: { type: Schema.Types.ObjectId, ref: 'IssueType' },
	_owner: { type: Schema.Types.ObjectId, ref: 'User' },
	_assignee: { type: Schema.Types.ObjectId, ref: 'User' }
});

Issue.pre('save', function(next) {
	this.updatedOn = Date.now;
	next();
});

Issue.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Issue', Issue);

