'use strict';

const fetch = require('node-fetch');

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


    socket.on('search bookshelf', data => {
      // find author or title using $or
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
