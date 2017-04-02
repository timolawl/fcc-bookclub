'use strict';

const Controller = require('./controllers/controller');

module.exports = (app, passport, io) => {

    const controller = new Controller();

    app.route('/')
       .get((req, res) => {
           if (req.isAuthenticated())
            // join main socket io room (this room is needed as at this level, polls can be added and deleted at will) and any previous room
             res.render('index', { loggedIn: 'true', path: 'index' }); //loggedIn still needed to not display the 'sign up' button
           else res.render('index', { path: 'index' });
        });

    app.route('/signup') // this allows for the question mark path.
        // any other path should disconnect the user from any previous room, as they are not needed.
        .get(isNotLoggedIn, (req, res) => {
            res.render('userform', { path: 'signup', message: req.flash('signupMessage') });
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/mybookshelf',
            failureRedirect: '/signup',
            failureFlash: true
        }));

    app.route('/login')
        .get(isNotLoggedIn, (req, res) => {
            res.render('userform', { path: 'login', message: req.flash('loginMessage') }); // should I only have one file between signup and login? Just pass in an object to specify which is which?
        })
        .post(passport.authenticate('local-login', {
            successRedirect: '/mybookshelf',
            failureRedirect: '/login',
            failureFlash: true
        }));
       
    
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });

    app.route('/allbookshelves')
 //     .get(controller.getAllBookshelves(io));
  
      .get((req, res) => {
//      .get(isLoggedIn, (req, res) => {
          // no need to join a socket room here because at this page, nothing will change at this level
        if (req.isAuthenticated())
          res.render('allbookshelves', { loggedIn: 'true', path: 'allbookshelves' }); // use index? again, using loggedIn for setting the right nav bar, but there could be a cleaner way of doing this.
        else res.render('allbookshelves', { loggedIn: 'false', path: 'allbookshelves' });
      });
      

    app.route('/mybookshelf')
    //  .get(isLoggedIn, controller.getMyBookshelf(io));

  
      .get(isLoggedIn, (req, res) => {
//      .get(isLoggedIn, (req, res) => {
          // no need to join a socket room here because at this page, nothing will change at this level
        res.render('mybookshelf', { loggedIn: 'true', path: 'mybookshelf' }); // use index? again, using loggedIn for setting the right nav bar, but there could be a cleaner way of doing this.
      });
      



    app.route('/request')
 //     .get(isLoggedIn, controller.getRequest(io))
      
 //     .post(isLoggedIn, controller.postRequest(io));
  
      .get(isLoggedIn, (req, res) => {
        res.render('request', { loggedIn: 'true', path: 'request', message: req.flash('processRequestError') }); // need message here?
      })

      .post(isLoggedIn, controller.postRequest(io));


    app.route('/pending')
     // .get(isLoggedIn, controller.getPending);
  
      .get(isLoggedIn, (req, res) => {
        res.render('pending', { loggedIn: 'true', path: 'pending' });
      });
      
      
    app.route('/completed')
      .get(isLoggedIn, (req, res) => {
        res.render('completed', { loggedIn: 'true', path: 'completed' });
      });

    app.route('/settings')
      .get(isLoggedIn, controller.getSettings)
  
      .post(isLoggedIn, controller.postSettings);
        

/*
      .get((req, res) => {
        res.render('settings', { loggedIn: 'true', path: 'settings' });
      });
      */

    app.use((req, res) => {
      if (req.isAuthenticated())
        res.render('404', { loggedIn: 'true', path: '404' });
      else res.render('404', { loggedIn: 'false', path: '404' });
    });
    //app.use((req, res) => { res.status(400).send('Bad request.'); });
};

function isLoggedIn (req, res, next) {
    if (req.isAuthenticated()) // isAuthenticated is a passport JS add-on method
        return next();
    res.redirect('/signup');
}

function isNotLoggedIn (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/mybookshelf');
    else return next();
}

