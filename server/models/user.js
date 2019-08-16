let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
  nickname: String,
  birthdate: Date
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);