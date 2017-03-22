'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;


const userSchema = new mongoose.Schema({
  local: {
    username    : { type: String, required: true, unique: true },
    email       : { type: String, required: true, unique: true },
    password    : { type: String, required: true, select: false },
    name        : { firstName: { type: String, required: true },
                    lastName: { type: String, required: true } },
    address     : { street: { type: String, required: true },
                    city: { type: String, required: true },
                    state: { type: String, required: true } }
  }
});


// conver to using promises
userSchema.pre('save', function (next) {
  const user = this;
  // only hash the password if it has been modified or is new
  if (!user.isModified('local.password')) return next();

  // generate a salt:
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    // hash the password along with our new salt
    bcrypt.hash(user.local.password, salt, (err, hash) => {
      if (err) return next(err);

      user.local.password = hash;
      return next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.local.password, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);
