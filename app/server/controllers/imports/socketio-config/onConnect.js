'use strict';

const mongoose = require('mongoose');

const Book = require('../../../models/book');

function onConnect (namespace) {
  console.log('what is going on?!');
  console.log(namespace);
  return function (socket) {
    // this only works if the user is already registered and logged in:
    let userID;

    if (socket.request.session.passport) {
      userID = socket.request.session.passport.user;
    }

    console.log('hi o hi, connecting from: ' + namespace);

/*
    // socket rooms
    socket.on('leave room', function (data) {
      if (socket.room !== undefined)
        socket.leave(socket.room);
    });

    socket.on('change room', function (data) {
      if (socket.room !== undefined)
        socket.leave(socket.room);
      socket.room = data.room;
      socket.join(socket.room);
    });
    */

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

        socket.of(namespace).emit('CREATE.book.render', { book: socketBook });

        //socket.to('allbookshelves').emit('CREATE.book.render', { book: socketBook });
        // if the user is the same as the submitter, add it to his or her bookshelf
        // check for room, if user is in my
        socket.emit('CREATE.book.render', { book: socketBook });
        socket.off('CREATE.book');
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

    // population request from client
    socket.on('READ.bookshelves.all', data => {

      console.log('READ.bookshelves.all ' + namespace);

      // retrieve all books sorted by date added and return
      Book.find({}).sort({ dateAdded: 1 }).exec((err, books) => {
        if (err) throw err;
        if (!books) console.log('no books!');
        else {
          let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail, transactionLock: book.transactionLock }});
          socket.emit('READ.bookshelves.all.render', { books: socketBooks });
        }
      });
    });

    // population request from client
    socket.on('READ.bookshelf.all', data => {
      Book.find({ currentOwner: userID }).sort({ dateAdded: 1 }).exec((err, books) => {
        if (err) throw err;
        if (!books) console.log('no books here!');
        else {
          // pass only needed information: img thumbnail and book id:
          let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail, transactionLock: book.transactionLock }});
          socket.emit('READ.bookshelf.all.render', { books: socketBooks });
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
          let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail, transactionLock: book.transactionLock }});
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
          let socketBooks = books.map(book => { return { _id: book._id, thumbnail: book.thumbnail, transactionLock: book.transactionLock }});
          socket.emit('READ.bookshelf.query.render', { query: data.search, books: socketBooks });
        }
      });
    });


    /*
    socket.on('CREATE.transaction', data => {
      
    });
    */



    // successful swap -> bookshelves will need to display the swapped books ability
    // to take swap requests
    socket.on('UPDATE.bookshelves', data => {
    
    });

    // successful swap -> bookshelf will need to display the newly acquired book
    // and have the swapped out book removed from the listing
    // book should be able to take on swap requests (marks also need to be displayed here)
    // should a swapped book update their dateAdded? I think they should.
    socket.on('UPDATE.bookshelf', data => {
      // hence, an update will consist of adding the new book at the front
      // and removing the old element.
    });   
  }
}

module.exports = onConnect;
