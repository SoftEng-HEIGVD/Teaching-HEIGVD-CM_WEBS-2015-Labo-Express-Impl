var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var IssueType = new Schema({
  name: String,
  description: String
});

IssueType.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('IssueType', IssueType);

