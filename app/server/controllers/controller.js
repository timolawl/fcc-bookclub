'use strict'

//const uuid = require('node-uuid'); // nonce creation

const User = require('../models/user');
const Book = require('../models/book');
const Transaction = require('../models/transaction');


// individual path controllers
//const AllbookshelvesPathController = require('./imports/allbookshelves');
//const MybookshelfPathController = require('./imports/mybookshelf');
//const RequestPathController = require('./imports/request');


function controller () {
/*
  const allbookshelvesPathController = new AllbookshelvesPathController();
  const mybookshelfPathController = new MybookshelfPathController();
  const requestPathController = new RequestPathController();

  this.getAllBookshelves = allbookshelvesPathController.getAllBookshelves;

  this.getMyBookshelf = mybookshelfPathController.getMyBookshelf;

  this.getRequest = requestPathController.getRequest;
  this.postRequest = requestPathController.postRequest;
*/


  //this.postRequest = (req, res) => {

  this.postRequest = io => {

    return (req, res) => {

      // CREATE.transaction

      let requestValidated = false;

      function renderRequestPageWithErrorMessage () {
        console.log('render request page error');
        req.flash('processRequestError', 'An error occurred processing your request.');
        res.render('request', { loggedIn: 'true', path: 'request', message: req.flash('processRequestError') });
      }

      // validate request
      // req.body.requestId / req.body.offerId
      // 1. check validity of the id:
      let re = /^[0-9a-f]{24}$/;
      if (re.test(req.body.requestId) && re.test(req.body.offerId)) { // qualifies as mongodb id
        // look up the offer Id to see if it belongs to the current user
        Book.findOne({ _id: req.body.offerId }).exec().then(offeredBook => {

          if (!offeredBook) { // book doesn't even exist with this id
            console.log('No such book under this id exists');
          }
          else if (offeredBook.currentOwner.toString() === req.user.id && !offeredBook.transactionLock) { // book found and belongs to req user and is not locked for swapping
            // check other book
            return Book.findOne({ _id: req.body.requestId }).exec().then(requestedBook => {
              if (!requestedBook) {
                console.log('No such book under this id exists.');
              }
              else if (!requestedBook.transactionLock) { // not locked for swapping
                // everything good! make a transaction request!
                let newTransaction = new Transaction();
                newTransaction.requester = offeredBook.currentOwner;
                newTransaction.bookRequestedId = requestedBook._id;
                newTransaction.bookRequestedThumbnail = requestedBook.thumbnail;
                newTransaction.bookRequestedTitle = requestedBook.title;
                newTransaction.requestee = requestedBook.currentOwner;
                newTransaction.bookOfferedId = offeredBook._id;
                newTransaction.bookOfferedThumbnail = offeredBook.thumbnail;
                newTransaction.bookOfferedTitle = offeredBook.title;
                newTransaction.dateOfRequest = Date.now();

                requestedBook.transactionLock = true;
                offeredBook.transactionLock = true;

                let p1 = newTransaction.save();
                let p2 = requestedBook.save();
                let p3 = offeredBook.save();



                return Promise.all([p1, p2, p3])
                  .then(() => {
                    requestValidated = true;
                  });

                /*
                return newTransaction.save(err => {
                  if (err) throw err;
                  requestedBook.transactionLock = true; // lock the books!
                  return requestedBook.save(err => {
                    if (err) throw err;
                    offeredBook.transactionLock = true;
                    return offeredBook.save(err => {
                      console.log('hello!');
                      if (err) throw err;
                      return requestValidated = true;
                    });
                  });
                });
                */
              }
            });
          }
        })
        .then(() => {
          if (!requestValidated) { // if at any step the request validation messed up:
            renderRequestPageWithErrorMessage();
          }
          else {
            // this socket emission doesn't work --- hangs the program
            //io.sockets.emit('CREATE.transaction.render', { rBookId: requestedBook._id, oBookId: offeredBook._id });
            res.redirect('/pending'); // redirect user to pending
          }
        });
      }
      else renderRequestPageWithErrorMessage();

    }


    // we're given two book ids

    // if valid, then process request and redirect the user to their pending transactions
    
    // if not valid, return the user to the request page with a flash message of the error
  
   
  };

  /*
  this.getPending = (req, res) => {

    res.render('pending', { loggedIn: 'true', path: 'pending' });
  };
*/




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

  this.postSettings = (req, res) => {

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
