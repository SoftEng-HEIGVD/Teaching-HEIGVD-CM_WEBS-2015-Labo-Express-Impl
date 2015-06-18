var
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	CommentSchema = mongoose.model('Comment').schema;


var IssueSchema = new Schema({
	description: String,
	lng: Number,
	lat: Number,
	loc: [],
	zip: Number,
	state: String,
	imageUrl: String,
	tags: [ String ],
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date, default: Date.now },
	comments: [ CommentSchema ],
	_actions: [ { type: Schema.Types.ObjectId, ref: 'Action' } ],
	_issueType: { type: Schema.Types.ObjectId, ref: 'IssueType' },
	_owner: { type: Schema.Types.ObjectId, ref: 'User' },
	_assignee: { type: Schema.Types.ObjectId, ref: 'User' }
});

IssueSchema.index({ loc: '2d' });

IssueSchema.pre('save', function(next) {
	this.updatedOn = new Date();
	if (this.lat && this.lng) {
		this.loc = [this.lng, this.lat];
	}
	next();
});

mongoose.model('Issue', IssueSchema);
