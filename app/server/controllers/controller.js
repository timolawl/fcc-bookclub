'use strict'

//const uuid = require('node-uuid'); // nonce creation

const User = require('../models/user');


function controller () {
  this.getSettings = (req, res) => {
    // find user in db
    //console.log(req.user.id);
    //console.log(req.session);
    User.findOne({ _id: req.user.id }).exec((err, user) => {
      if (err) throw err;
      if (!user) console.log('No such user found..?');
      else {
        //console.log(user);
        // populate the fields with the user information
        let userObject = {};
        userObject['first-name'] = user.local.name.firstName;
        userObject['last-name'] = user.local.name.lastName;
        userObject['address-line-1'] = user.local.address.address1;
        userObject['address-line-2'] = user.local.address.address2;
        userObject.city = user.local.address.city;
        userObject.state = user.local.address.state;
        userObject.zip = user.local.address.zip;

        res.render('userform', { loggedIn: 'true', path: 'settings', userInfo: userObject, message: req.flash('settingsMessage') });
        /*
        user.local.name.firstName = req.body.first-name;
        user.local.name.lastName = req.body.last-name;
        user.local.address.
        */
      }
    });
    // load user info into the render
  };

  this.saveSettings = (req, res) => {

    // if information is the same, do nothing but reload the page and say that it has been saved
    //
    // else, actually change it in the db, then reload the page with the new info
    
    // strip all $ in the body before passing to be saved in the db

    const sanitizedBody = Object.assign({}, req.body);

    Object.keys(sanitizedBody).forEach((e) => sanitizedBody[e] = sanitizedBody[e].replace(/\$/g, ''));

    //console.log(sanitizedBody);

    // save to db:
    User.findOne({ _id: req.user.id }).exec((err, user) => {
      if (err) throw err;
      if (!user) console.log('User not found..');
      else {
        user.local.name.firstName = sanitizedBody['first-name'];
        user.local.name.lastName = sanitizedBody['last-name'];
        user.local.address.address1 = sanitizedBody['address-line-1'];
        user.local.address.address2 = sanitizedBody['address-line-2'];
        user.local.address.city = sanitizedBody.city;
        user.local.address.state = sanitizedBody.state;
        user.local.address.zip = sanitizedBody.zip;

        user.save(err => {
          if (err) throw err;
          console.log('User information saved to db!');
        });
      }
    });


    req.flash('settingsMessage', 'Personal information has been updated!');
    res.render('userform', { loggedIn: 'true', path: 'settings', userInfo: sanitizedBody, message: req.flash('settingsMessage') });
  };
}

module.exports = controller;
