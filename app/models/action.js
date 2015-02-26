var
	mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ActionSchema = new Schema({
  user: String,
	actionDate: { type: Date, default: Date.now},
  actionType: String,
  reason: String,
  _issue: { type: Schema.Types.ObjectId, ref: 'Issue' }
});

ActionSchema.pre('save', function(next) {
	this.actionDate = new Date();
	next();
});

mongoose.model('Action', ActionSchema);
