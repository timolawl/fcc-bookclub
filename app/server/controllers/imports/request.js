'use strict';

const mongoose = require('mongoose');

const Book = require('../../models/book');

const onConnect = require('./socketio-config/onConnect'); 

function request () {
  this.getRequest = io => {
    return function (req, res) {
      res.render('request', { loggedIn: 'true', path: 'request', message: req.flash('processRequestError') });


      io.of('/request')
        .on('connection', onConnect('/request'));
    }
  }

      /*
        .on('connection', socket => {

          let userID;

          if (socket.request.session.passport) {
            userID = socket.request.session.passport.user;
          }

          socket.on('READ.book', data => {
            // mongoose.Schema.Types.ObjectId(data.bookId)
            Book.findOne({ _id: data.bookId }).exec((err, book) => {
              if (err) throw err;
              if (!book) console.log('Error, book not found...');
              else {
                // this data will be used in the displayPreview function,
                // so only title, link, author, and description are needed to be passed to client:
                let socketBook = {};
                socketBook._id = book._id; // for the swap button
                socketBook.title = book.title;
                socketBook.link = book.link;
                socketBook.author = book.author;
                socketBook.description = book.description;
                socketBook.thumbnail = book.thumbnail; // request preview picture

                //console.log(data.bookId);
                //console.log(book);
                socket.emit('READ.book.render', { book: socketBook });
              }
            });
          });

          // search request from client
          socket.on('READ.bookshelves.query', data => {
            let dbQuery;

            if (data.request) { // if the source of the query was from the request path
              dbQuery = { $and: [ { currentOwner: { $ne: userID } },
                                  { $or: [{ ISBN_10: data.search },
                                          { ISBN_13: data.search },
                                          { title: { $regex: data.search, $options: 'i' } },
                                          { author: { $regex: data.search, $options: 'i' } }] } ]};
            }
            else {
              dbQuery = { $or: [{ ISBN_10: data.search },
                                { ISBN_13: data.search },
                                { title: { $regex: data.search, $options: 'i' } },
                                { author: { $regex: data.search, $options: 'i' } }] };
            }

            Book.find(dbQuery)
                .sort({ dateAdded: -1 })
                .exec((err, books) => {
              if (err) throw err;
              if (!books) {
                socket.emit('READ.bookshelves.query.render', {});
              }
              else {
                // pass only needed information: img thumbnail and book id:
                let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail }});
                socket.emit('READ.bookshelves.query.render', { query: data.search, books: socketBooks });
              }
            });  
          });


          // search request from client
          socket.on('READ.bookshelf.query', data => {
            Book.find({ $and: [ { currentOwner: userID },
                                  { $or: [{ ISBN_10: data.search },
                                          { ISBN_13: data.search },
                                          { title: { $regex: data.search, $options: 'i' } },
                                          { author: { $regex: data.search, $options: 'i' } }] } ]})
                .sort({ dateAdded: -1 })
                .exec((err, books) => {
              if (err) throw err;
              if (!books) {
                socket.emit('READ.bookshelf.query.render', {});
              }
              else {
                // pass only needed information: img thumbnail and book id:
                let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail }});
                socket.emit('READ.bookshelf.query.render', { query: data.search, books: socketBooks });
              }
            });
          });


        });

    }
  };
  */

  this.postRequest = io => {
    return function (req, res) {
      
      io.of('/request')
        .on('connection', socket => {

          let userID;

          if (socket.request.session.passport) {
            userID = socket.request.session.passport.user;
          }


        


          // CREATE.transaction

          let requestValidated = false;

          function renderRequestPageWithErrorMessage () {
            req.flash('processRequestError', 'An error occurred processing your request.');
            res.render('request', { loggedIn: 'true', path: 'request', message: req.flash('processRequestError') });
          }

          console.log(req.body);
          // validate request
          // req.body.requestId / req.body.offerId
          // 1. check validity of the id:
          let re = /^[0-9a-f]{24}$/;
          if (re.test(req.body.requestId) && re.test(req.body.offerId)) { // qualifies as mongodb id
            // look up the offer Id to see if it belongs to the current user
            //
            console.log('good up to here!');
            
            Book.findOne({ _id: req.body.offerId }).exec((err, offeredBook) => {

              console.log('plz');
              console.log(offeredBook.currentOwner);
              console.log(req.user.id);
              console.log(offeredBook.transactionLock);


              if (err) throw err;
              if (!offeredBook) { // book doesn't even exist with this id
                console.log('No such book under this id exists');
              }
              else if (offeredBook.currentOwner.toString() === req.user.id && !offeredBook.transactionLock) { // book found and belongs to req user and is not locked for swapping
                // check other book
                console.log('checkpoint 2!');
                return Book.findOne({ _id: req.body.requestId }).exec((err, requestedBook) => {
                  if (err) throw err;
                  if (!requestedBook) {
                    console.log('No such book under this id exists.');
                  }
                  else if (!requestedBook.transactionLock) { // not locked for swapping
                    // everything good! make a transaction request!
                    console.log('made it this far?!');
                    let newTransaction = new Transaction();
                    newTransaction.requester = offeredBook.currentOwner;
                    newTransaction.bookRequested = requestedBook;
                    newTransaction.requestee = requestedBook.currentOwner;
                    newTransaction.bookOffered = offeredBook;
                    newTransaction.dateOfRequest = Date.now();
                    return newTransaction.save(err => {
                      if (err) throw err;
                      requestedBook.transactionLock = true; // lock the books!
                      return requestedBook.save(err => {
                        if (err) throw err;
                        offeredBook.transactionLock = true;
                        return offeredBook.save(err => {
                          console.log('hello!');
                          if (err) throw err;
                          requestValidated = true;
                          socket.emit('CREATE.transaction', { rBookId: requestedBook._id, oBookId: offeredBook._id });
                          res.redirect('/pending'); // redirect user to pending
                        });
                      });
                    });
                  }
                });
              }
            })
            .then(() => {
              if (!requestValidated) { // if at any step the request validation messed up:
                renderRequestPageWithErrorMessage();
              }
            });
          }
          else renderRequestPageWithErrorMessage();


        });
    }
  };
}

module.exports = request;
