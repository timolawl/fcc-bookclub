'use strict';

const mongoose = require('mongoose');

const fetch = require('node-fetch');

const User = require('../models/user');
const Book = require('../models/book');

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
      const socketBook = {};
      newBook.title = socketBook.title = data.title;
      newBook.author = socketBook.author = data.author;
      newBook.description = socketBook.description = data.description;
      newBook.thumbnail = socketBook.thumbnail = data.thumbnail;
      newBook.link = socketBook.link = data.link;
      newBook.ISBN_10 = socketBook.ISBN_10 = data.ISBN_10 || '';
      newBook.ISBN_13 = socketBook.ISBN_13 = data.ISBN_13 || '';
      newBook.dateAdded = socketBook.dateAdded = Date.now();
      newBook.currentOwner = userID; // passing this to client is probably a bad idea
      newBook.save(err => {
        if (err) console.error(err);
        // pass mongodDB document id as identifier for the book to client....sounds dangerous?
        // but the alternative to generate a nonce that while small has a chance of colliding
        // not sure what the best option is.
        //
        socketBook.id = newBook.id;

        socket.to('allbookshelves').emit('CREATE.book.render', { book: newBook });
        // if the user is the same as the submitter, add it to his or her bookshelf
        // check for room, if user is in my
        socket.emit('CREATE.book.render', { book: newBook });
      });
    });

    socket.on('READ.book', data => {
      // mongoose.Schema.Types.ObjectId(data.bookId)
      Book.findOne({ _id: data.bookId }).exec((err, book) => {
        if (err) throw err;
        if (!book) console.log('Error, book not found...');
        else {
          console.log(data.bookId);
          console.log(book);
          socket.emit('READ.book.render', { book: book });
        }
      });
    });

    // population request from client
    socket.on('READ.bookshelves.all', data => {
      // retrieve all books sorted by date added and return
      Book.find({}).sort({ dateAdded: -1 }).exec((err, books) => {
        if (err) throw err;
        if (!books) console.log('no books!');
        else {
          socket.emit('READ.bookshelves.all.render', { books: books });
        }
      });
    });

    // population request from client
    socket.on('READ.bookshelf.all', data => {
      Book.find({ currentOwner: userID }).sort({ dateAdded: -1 }).exec((err, books) => {
        if (err) throw err;
        if (!books) console.log('no books here!');
        else {
          socket.emit('READ.bookshelf.all.render', { books: books });
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
          socket.emit('READ.bookshelves.query.render', { query: data.search, books: books });
        }
      });  
    });

    // search request from client
    socket.on('READ.bookshelf.query', data => {
      Book.find({ $or: [{ ISBN_10: data.search },
                                { ISBN_13: data.search },
                                { title: { $regex: data.search, $options: 'i' } },
                                { author: { $regex: data.search, $options: 'i' } }] })
          .sort({ dateAdded: -1 })
          .exec((err, books) => {
        if (err) throw err;
        if (!books) {
          socket.emit('READ.bookshelf.query.render', {});
        }
        else {
          socket.emit('READ.bookshelf.query.render', { query: data.search, books: books });
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




    socket.on('bar search', function (data) {

      const params = 'grant_type=client_credentials' + '&' +
        'client_id=' + process.env.YELP_APP_ID + '&' +
        'client_secret=' + process.env.YELP_APP_SECRET;

      const reqTokenURL = 'https://api.yelp.com/oauth2/token';
      const searchNearbyURL = 'https://api.yelp.com/v3/businesses/search';
      const location = 'location=' + encodeURIComponent(data.location);
      const businessesQueryURL = `${searchNearbyURL}?${location}&categories=bars`;
      let authorizationHeader = '';

      fetch(reqTokenURL, { method: 'POST', body: params })
        .then(res => res.json())
        .then(json => {
          authorizationHeader = json.token_type + ' ' + json.access_token;
          // here you want to do the actual search
          return fetch(businessesQueryURL, { method: 'GET', headers: { Authorization: authorizationHeader } })
        })
        .then(res => res.json())
        .then(json => {
          let promises = json.businesses.slice(0).map(business => {
            var businessReviewURL = `https://api.yelp.com/v3/businesses/${business.id}/reviews`;
            return fetch(businessReviewURL, { method: 'GET', headers: { Authorization: authorizationHeader } })
              .then(res => res.json())
              .then(json => {
                if (json.reviews[0]) {
                  business.excerpt = json.reviews[0].text; // save excerpt
                }
                return business;
              });
          });

          Promise.all(promises).then(businessListings => {
            let businessIDs = businessListings.map(business => business.id);

            let yelpReviews = businessListings.map(businessListing => {
              const condensedReview = {};
              condensedReview.id = businessListing.id; // needed for lookup later.
              condensedReview.image_url = businessListing.image_url;
              condensedReview.url = businessListing.url;
              condensedReview.name = businessListing.name;
              condensedReview.excerpt = businessListing.excerpt;
              condensedReview.guestCount = 0;
              condensedReview.attending = false;
              return condensedReview;
            });

            // compare the listings with the bars with attendees

            let promise = Bar.find({
              name: { $in: businessIDs },
              guestCount: { $gt: 0 }
            }).exec((err, docs) => {
              if (err) throw err;
              docs.forEach(doc => {
                let businessToUpdateIndex = yelpReviews.findIndex(biz => biz.id === doc.name);
                if (businessToUpdateIndex > -1) { // business found
                  yelpReviews[businessToUpdateIndex].guestCount = doc.guestCount;
                  if (doc.guestList.find(user => user === userID)) { // user found
                    yelpReviews[businessToUpdateIndex].attending = true;
                  }
                }

              });
            });

            promise.then(() => {
              socket.emit('bar results', { reviews: yelpReviews });
            });


          }, function (err) {
            console.log(err);
            console.error('Uh oh, something went wrong.');
          });
        });
    });

    socket.on('add attendance', function (data) {
      // remove all old rsvps from all bars

      Bar.findOne({ 'name': data.bar }).exec((err, bar) => {
        if (err) throw err;
        if (!bar) {
          const newBar = new Bar();
          newBar.name = data.bar;
          newBar.guestList.push(userID);
          newBar.guestCount += 1;
          
          newBar.save(err => {
            if (err) {
              console.log(err);
              console.log('something went wrong');
            } // throw err;
            // broadcast the update to all other users
            socket.broadcast.emit('update', { bar: newBar });
          });
        }
        else {
          bar.guestList.push(userID);
          bar.guestCount += 1;
          bar.save(err => {
            if (err) throw err;
          });
          socket.broadcast.emit('update', { bar: bar });
        }
      });

    });

    socket.on('remove attendance', function (data) {
/*
      Bar.update(
        { 'name': data.bar },
        { $pull: { 'guestList': userID },
          $inc: { 'guestCount': -1 } }
      );
*/
      
      Bar.findOneAndUpdate({ 'name': data.bar }, 
        { $pull: { 'guestList': userID },
          $inc: { 'guestCount': -1 } },
        { new: true }, (err, bar) => { // option true sets mongodb to return changed doc
          if (err) throw error;
          else {
            bar.save(err => {
              if (err) throw err;
            });
            socket.broadcast.emit('update', { bar: bar });
          }
        });
      
      
      /*
      Bar.findOne({ 'name': data.bar }).exec((err, bar) => {
        if (err) throw err;
        if (!bar) throw err;
        else {
         // bar.guestList.remove({ attendee: userID }, (err, bar) => {
        
          bar.remove(userID, (err, bar) => {
            if (err) throw err;
            else {
              bar.guestCount -= 1;
              bar.save(err => {
                if (err) throw err;
              });
            }
          });
        }
      });
      */
    });

  });
};
