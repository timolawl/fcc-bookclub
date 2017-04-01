'use strict';

// es6 modules are not natively supported in V8 yet..

require('dotenv').config(); // loads env vars (don't need in prod)

// built-in requires
const path = require('path'); // for joining paths

// main base tech stack requires
const express = require('express');
const app = express();

// socket io requires
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// other base tech stack requires
const favicon = require('serve-favicon');

// database requires
const mongoose = require('mongoose'); // already includes mongoDB

// security requires
const helmet = require('helmet');

// performance requires
const compression = require('compression'); // compresses req/res 

// authentication and its dependency requires
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session'); // session data is not saved in the cookie itself, just the session ID. Session data is stored server-side.
const MongoStore = require('connect-mongo')(session); // move store from mem to mongo
const passport = require('passport');

// development requires
const morgan = require('morgan'); // allows for every HTTP request to be logged to console

// custom requires
const port = process.env.PORT || 5000;
const routes = require('./app/server/routes');
const config = require('./app/server/config');

mongoose.connect(config.dbURI);
mongoose.connection.on('error', () => {
    console.log('Error: Could not connect to MongoDB. Did you forget to run "mongod"?');
});


require('./app/server/controllers/middlewares/passport')(passport); // pass passport for configuration.
// require('./app/server/controllers/socketio')(io); // pass socketio for config?

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/app/server/views'));
app.locals.basedir = app.get('views'); // allows for pug includes


app.set('port', port);

app.use(bodyParser.urlencoded({ extended: true }));


app.use(compression()); // compresses all req and res
app.use(helmet()); // can set up CSP against XSS attacks. 7/10 of its headers implemented by default.
app.use('/static', express.static(path.join(__dirname,'/static')));
app.use(favicon(path.join(__dirname, '/static/img/favicon.ico')));


app.use(morgan('dev')); // log every request to console.

// configure the session
const sessionMiddleware = session({
    secret: config.sessionSecret,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false, // no ability for non-authorized; no reason to save.
    cookie: { secure: 'auto' } // didn't specify true as working between dev/prod. auto automatically determines, however if set on https then going to http will not show cookie.
});


app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


routes(app, passport, io); // apparently it doesn't matter if this is before or after the port is set...
/*
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
*/


// set up socket io: http://stackoverflow.com/questions/13095418/how-to-use-passport-with-express-and-socket-io#24859515
//
// problem is that the session becomes read only, but that should be fine (assuming it doesn't mess with the logout or login features) because the session cookie only stores the ID.
// but I still need to see if there's even a reason for having socket interact with the session.
//

io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next);
});


server.listen(app.get('port'), () => {
  console.log('Socket.io is listening on port', app.get('port'));
});


