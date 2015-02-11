var
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var Comment = new Schema({
  text: String,
	postedOn: { type: Date, default: Date.now},
	_author: { type: Schema.Types.ObjectId, ref: 'User' }
});

Comment.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Comment', Comment);

