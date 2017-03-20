'use strict';

const Controller = require('./controllers/controller');

module.exports = (app, passport) => {

  const controller = new Controller();

  app.route('/')
    .get(controller.loadProfile);

  app.route('/login/facebook')
    .get(passport.authenticate('facebook'));

  app.route('/login/facebook/callback')
    .get(passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

  app.route('/login/twitter')
    .get(passport.authenticate('twitter'));

  app.route('/login/twitter/callback')
    .get(passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
      
      
  
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/'); // should redirect depending on content in input box
    });
/*
  app.use((req, res) => {
    if (req.isAuthenticated())
      res.render('404', { loggedIn: 'true', path: '404' });
    else res.render('404', { loggedIn: 'false', path: '404' });
  });
  */
  app.use((req, res) => { res.status(400).send('Bad request.'); });


};
