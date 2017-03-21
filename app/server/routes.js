'use strict';

const Controller = require('./controllers/controller');

module.exports = (app, passport) => {

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
            successRedirect: '/',
            failureRedirect: '/signup',
            failureFlash: true
        }));

    app.route('/login')
        .get(isNotLoggedIn, (req, res) => {
            res.render('userform', { path: 'login', message: req.flash('loginMessage') }); // should I only have one file between signup and login? Just pass in an object to specify which is which?
        })
        .post(passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        }));
       
    
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });
/*
    app.route('/reset')
        .get((req, res) => {
            res.render('userform', { path: 'reset' });
        });
*/
    app.route('/createpoll')
        .get(isLoggedIn, (req, res) => {
            req.flash('createPollMessage', 'Invalid entries. Please try again.');
            res.render('pollform', { loggedIn: 'true', path: 'createpoll', message: req.flash('createPollMessage') }); // each option needs to pass through logIn middleware. Using loggedIn for setting the right nav bar..
        })
        .post((req, res, next) => {
          if (req.isAuthenticated()) {
            return next();
          }
          else res.redirect('/');
        }, controller.createpoll); // eschewing duplication check
  /*
        .post(isUnique, (req, res) => { // check if there is identical?
            nonce = uuid.v4(); // save this to the db, along with the req body.
            
            // leave off here? **NEED TO SAVE THE req.body stuff to the schema**
            // What else can be in the controller? Would this essentially be the
            // middleware that separates out the talking to the database, leaving
            // the routes relatively clean?

            // save nonce as permalink, name and options as initial data
            // how do I create a poll so that I have options, but no votes yet?
            // this has more to do with rendering in Chart js than it does the db.
            res.redirect('/' + nonce);
            console.log(req.body);
        });
*/

    app.route('/mypolls')
        .get(isLoggedIn, (req, res) => {
            // no need to join a socket room here because at this page, nothing will change at this level
            res.render('mypolls', { loggedIn: 'true', path: 'mypolls' }); // use index? again, using loggedIn for setting the right nav bar, but there could be a cleaner way of doing this.
        });

    app.route(/^\/poll\/[0-9a-f-]+$/) // nonce path; I'll need to retrieve the poll from this permalink somehow... this also needs to verify the existence of the path in the server, otherwise display error.
        .get(controller.renderpoll)
        
        .delete(controller.deletepoll);

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
    res.redirect('/');
}

function isNotLoggedIn (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/');
    else return next();
}
/*
function isUnique (req, res, next) { // check if the poll name is unique before creating
    if (controller.checkUnique)
        return next();
    req.flash('uniqueMessage', 'Name of poll is not unique.');
    res.redirect('/createpoll');
}
  */
