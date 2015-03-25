var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var IssueTypeSchema = new Schema({
	code: String,
  name: String,
  description: String
});

mongoose.model('IssueType', IssueTypeSchema);

