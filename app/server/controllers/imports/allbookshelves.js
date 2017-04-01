'use strict';

const mongoose = require('mongoose');

const Book = require('../../models/book');

const onConnect = require('./socketio-config/onConnect'); // socket io config

function allbookshelves () {
  this.getAllBookshelves = io => {
    return function (req, res) {

      if (req.isAuthenticated())
        res.render('allbookshelves', { loggedIn: 'true', path: 'allbookshelves' });
      else res.render('allbookshelves', { loggedIn: 'false', path: 'allbookshelves' });

      io.of('/allbookshelves')
        .on('connection', onConnect('/allbookshelves'));
    }
  }
}

module.exports = allbookshelves;

  /*
        .on('connection', socket => {

          let userID;

          if (socket.request.session.passport) {
            userID = socket.request.session.passport.user;
          }

        
          socket.on('CREATE.book', data => {
            // add current userID to the book just generated and save to books collection
            const newBook = new Book();
            const socketBook = {}; // passing only thumbnail and book id to client
            newBook.title = data.title;
            newBook.author = data.author;
            newBook.description = data.description;
            newBook.thumbnail = socketBook.thumbnail = data.thumbnail;
            newBook.link = data.link;
            newBook.ISBN_10 = data.ISBN_10 || '';
            newBook.ISBN_13 = data.ISBN_13 || '';
            newBook.dateAdded = Date.now();
            newBook.currentOwner = userID; // passing this to client is probably a bad idea
            newBook.save(err => {
              if (err) console.error(err);
              // pass mongodDB document id as identifier for the book to client....sounds dangerous?
              // but the alternative to generate a nonce that while small has a chance of colliding
              // not sure what the best option is.
              //
              socketBook._id = newBook._id;

              socket.of('/allbookshelves').emit('CREATE.book.render', { book: socketBook });
              // if the user is the same as the submitter, add it to his or her bookshelf
              // check for room, if user is in my
              //socket.emit('CREATE.book.render', { book: socketBook });
            });
          });

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


          socket.on('READ.bookshelves.all', data => {
            // retrieve all books sorted by date added and return
            Book.find({}).sort({ dateAdded: 1 }).exec((err, books) => {
              if (err) throw err;
              if (!books) console.log('no books!');
              else {
                let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail }});
                socket.emit('READ.bookshelves.all.render', { books: socketBooks });
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
        });
    }
  };
}

module.exports = allbookshelves;
      */
