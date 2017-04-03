'use strict';

const mongoose = require('mongoose');

const Book = require('../models/book');
const Transaction = require('../models/transaction');
const CompletedTransaction = require('../models/completedtransaction');

module.exports = io => {

  // acting as route and controller here.
  // the structured formatting would help for sure..
  

  io.on('connection', function (socket) {
    // this only works if the user is already registered and logged in:
    let userID;

    if (socket.request.session.passport) {
      userID = socket.request.session.passport.user;
    }

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

        //socket.of(

        socket.to('allbookshelves').emit('CREATE.book.render', { book: socketBook });
        // if the user is the same as the submitter, add it to his or her bookshelf
        // check for room, if user is in my
        socket.emit('CREATE.book.render', { book: socketBook });
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

          socket.emit('READ.book.render', { book: socketBook });
        }
      });
    });

    // population request from client
    socket.on('READ.bookshelves.all', data => {
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
                            { transactionLock: false },
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
      let dbQuery;

      if (data.request) {
        dbQuery = { $and: [ { currentOwner: userID },
                            { transactionLock: false },
                            { $or: [{ ISBN_10: data.search },
                                    { ISBN_13: data.search },
                                    { title: { $regex: data.search, $options: 'i' } },
                                    { author: { $regex: data.search, $options: 'i' } }] } ]};
      }
      else {
        dbQuery = { $and: [ { currentOwner: userID },
                            { $or: [{ ISBN_10: data.search },
                                    { ISBN_13: data.search },
                                    { title: { $regex: data.search, $options: 'i' } },
                                    { author: { $regex: data.search, $options: 'i' } }] } ]};

      }

      Book.find(dbQuery)
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


    socket.on('READ.transactions.pending', data => {

      // load all pending transactions involving the user:
      // 'Books I want' - user is the requester
      Transaction.find({ requester: userID }).sort({ dateOfRequest: 1 }).exec().then(rTransactions => {
        Transaction.find({ requestee: userID }).sort({ dateOfRequest: 1 }).exec().then(oTransactions => {

          // need book images and titles for request transactions
          // will also need id or some form for when it gets approved and socket pushes msg
          let rTrans = rTransactions.map(rTransaction => { return { _id: rTransaction._id, oBook: { thumbnail: rTransaction.bookOfferedThumbnail, title: rTransaction.bookOfferedTitle }, rBook: { thumbnail: rTransaction.bookRequestedThumbnail, title: rTransaction.bookRequestedTitle } } });

          // need book images, book ids, and titles for approving offer transactions
          let oTrans = oTransactions.map(oTransaction => { return { _id: oTransaction._id, oBook: { thumbnail: oTransaction.bookOfferedThumbnail, title: oTransaction.bookOfferedTitle }, rBook: { thumbnail: oTransaction.bookRequestedThumbnail, title: oTransaction.bookRequestedTitle } }});

          socket.emit('READ.transactions.pending.render', { requestTransactions: rTrans, offerTransactions: oTrans });
        });
      });

    });

    socket.on('READ.transactions.complete', data => {
      // pull up all complete transactions
      CompletedTransaction.find({ requester: userID }).sort({ dateOfSwap: 1 }).exec().then(rTransactions => {
        CompletedTransaction.find({ requestee: userID }).sort({ dateOfSwap: 1 }).exec().then(oTransactions => {

          // need book images and titles for request transactions
          // will also need id or some form for when it gets approved and socket pushes msg
          let rTrans = rTransactions.map(rTransaction => { return { oBook: { thumbnail: rTransaction.bookOfferedThumbnail, title: rTransaction.bookOfferedTitle }, rBook: { thumbnail: rTransaction.bookRequestedThumbnail, title: rTransaction.bookRequestedTitle } } });

          // need book images, book ids, and titles for approving offer transactions
          let oTrans = oTransactions.map(oTransaction => { return { oBook: { thumbnail: oTransaction.bookOfferedThumbnail, title: oTransaction.bookOfferedTitle }, rBook: { thumbnail: oTransaction.bookRequestedThumbnail, title: oTransaction.bookRequestedTitle } }});

          socket.emit('READ.transactions.complete.render', { requestTransactions: rTrans, offerTransactions: oTrans });
        });
      });
    });


    
    socket.on('DELETE.transaction', data => {
      Transaction.findOne({ _id: data._id }).then(transaction => {
        if (!transaction) console.error('Transaction not found.');
        if (transaction.requestee.toString() === userID) {

          Book.findOne({ _id: transaction.bookRequestedId }).exec().then(rBook => {
            Book.findOne({ _id: transaction.bookOfferedId }).exec().then(oBook => {

              if (data.option === 'approve') {
                const newCompletedTransaction = new CompletedTransaction(transaction);

                newCompletedTransaction.save();

                let tempOwner = rBook.currentOwner;
                rBook.currentOwner = oBook.currentOwner;
                oBook.currentOwner = tempOwner;
              }
              rBook.transactionLock = false;
              oBook.transactionLock = false;
              let p1 = rBook.save();
              let p2 = oBook.save();
              let p3 = Transaction.deleteOne({ _id: data._id }).exec();
              Promise.all([p1, p2, p3])
                .then(() => {
                  // update all with these two released books
                  socket.to('allbookshelves').emit('UPDATE.books.render', { book1: rBook._id, book2: oBook._id });
                  socket.to('mybookshelf').emit('UPDATE.books.render', { book1: rBook._id, book2: oBook._id });
                  socket.to('pending').emit('UPDATE.transactions.render', { transaction: data._id });
                  
                  // this requires having the client socket id and transmitting it to only the other person involved in the swap
                  //socket.to('complete').emit('UPDATE.transactions.render', { transaction: data._id });
                });

            });
          });
        }
      });
    });



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
  });
};
