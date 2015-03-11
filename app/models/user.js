var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  firstname: String,
  lastname: String,
  name: String,
  phone: String,
	roles: [ String ]
});


UserSchema.pre('save', function(next) {
	this.name = this.name.toLowerCase();
	next();
});

//if (!UserSchema.options.toObject) UserSchema.options.toObject = {};
//UserSchema.options.toObject.hide = '';
//UserSchema.options.toObject.transform = function (doc, ret, options) {
//  if (options.hide) {
//    options.hide.split(' ').forEach(function (prop) {
//      delete ret[prop];
//    });
//  }
//	ret.id = ret._id;
//	delete ret['_id'];
//	delete ret['__v'];
//}

mongoose.model('User', UserSchema);

