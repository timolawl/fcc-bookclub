'use strict';

const User = require('../models/user.js');
//const socket = require('./middleware/socketio');

module.exports = function controller () { // can't use arrow notation here because the this is execution context this and not lexical this
  this.loadProfile = (req, res) => {
    if (req.isAuthenticated()) { // authenticated using which method though?
      // load profile for user
      User.findOne({ _id: req.user.id }, function (err, user) {
        if (err) throw err;
        if (!user) {
          console.error('This should never happen..');
        }
        else {
          // load user social media platform used for login
          if (user.provider === 'twitter') {
            res.render('index', { loggedIn: 'true', provider: 'Twitter', displayName: user.twitterDisplayName });
          }
          else if (user.provider === 'facebook') {
            res.render('index', { loggedIn: 'true', provider: 'Facebook', displayName: user.facebookDisplayName });
          }
        }
      });
    }
    else res.render('index', { loggedIn: 'false' });
  };

};


