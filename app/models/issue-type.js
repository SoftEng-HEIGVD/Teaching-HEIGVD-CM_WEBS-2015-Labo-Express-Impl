var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var IssueType = new Schema({
  name: String,
  description: String
});

mongoose.model('IssueType', IssueType);

