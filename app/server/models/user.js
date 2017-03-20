'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  twitterID           : { type: String, unique: true },
  twitterDisplayName  : { type: String, unique: true },
  facebookID          : { type: String, unique: true },
  facebookDisplayName : { type: String, unique: true },
  provider            : String // the provider with which the user authenticated
  
});

userSchema.statics.findOrCreate = function (profile, cb) {
  var newUser = new this();

  this.findOne({ $or: [{ twitterID: profile.id }, { facebookID: profile.id }] }, function (err, result) {
    if (err) throw err;
    if (!result) {
      newUser.provider = profile.provider;

      if (profile.provider === 'facebook') {
        newUser.facebookID = profile.id;
        newUser.facebookDisplayName = profile.displayName;
      }

      if (profile.provider === 'twitter') {
        newUser.twitterID = profile.id; // do I need to save token and token secret?
        newUser.twitterDisplayName = profile.displayName;
      }
      
      newUser.save(cb); // interesting statement
    }
    else cb(err, result);
  });
};

module.exports = mongoose.model('User', userSchema);
