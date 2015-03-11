var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var IssueTypeSchema = new Schema({
  name: String,
  description: String
});

mongoose.model('IssueType', IssueTypeSchema);

