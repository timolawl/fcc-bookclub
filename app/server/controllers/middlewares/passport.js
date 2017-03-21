'use strict';

// best I can do is check validity and existence of email.

const validator = require('validator');
const neverbounce = require('neverbounce')({
    apiKey: process.env.NB_KEY,
    apiSecret: process.env.NB_SECRET
});


const LocalStrategy = require('passport-local').Strategy;

const User = require('../../models/user');
// [WITH EMAIL]
// const email = require('./email'); // email middleware for sending emails

module.exports = passport => {
    //serialization/deserialization of user for session..
    // serialize called when user logs in
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // deserialize the opposite, though explanation somewhat confusing:
    // takes the id stored in the session and we use that id to retrieve our user.
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });


    passport.use('local-signup', new LocalStrategy({
        passReqToCallback: true // allows for passing entire request to cb
    },
    (req, username, password, done) => {
        process.nextTick(() => {  // true async
          
            if (!validator.isEmail(req.body.email)) { // check email validity
                return done(null, false, req.flash('signupMessage', 'Entered email is not a valid email address.'));
            }
            neverbounce.single.verify(req.body.email).then( // check email existence; 1k verifications/month
            
                (result) => {
                    if (result.is(0)) { // if valid email
                        User.findOne({$or: [{ 'local.username': username.toLowerCase() },
                                            { 'local.email': req.body.email.toLowerCase() }]},
                        (err, user) => {
                            if (err) {
                                console.log('Error finding username or email');
                                return done(err);
                            }
                            if (user) {
                                return done(null, false, req.flash('signupMessage', 'Username or email is already in use.'));
                            } else { // Add new user
                                const newUser = new User();
                                newUser.local.username = username.toLowerCase();
                                newUser.local.email = req.body.email.toLowerCase();
                                newUser.local.password = password;
                                // [ WITH EMAIL ] (in the future...)
                                // need to make confirmation token (acct not yet active)
                                // during login, if acct found check if token exists
                                // if token exists then say that user needs to confirm
                                // if token does not exist, then assume confirmed?
                                // or maybe have a field to check confirmation status?
                                // save token, generate URL (need nodemailer/mailgun).
                                newUser.save(err => {
                                    if (err) throw err;
                                    done(null, newUser); // In the event I need to use the newUser?
                                    /*
                                    User.find({}, (err, users) => { // display User to console.
                                        if (err) throw err;
                                        console.log(users);
                                    });
                                    */
                                });
                            }
                        });
                    } else {
                        return done(null, false, req.flash('signupMessage', 'Entered email does not exist.'));
                    }
                },
                (error) => {
                    console.error('Something went wrong when checking email existence..', error);
                    return done(err);
                }
            );
        });
    }));

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email', // local strategy requires 2 fields; hence the temp switch
       // however, the problem is that req isn't passed, which is needed as well.
        passReqToCallback: true // allows for passing entire request to cb
    },
    (req, email, password, done) => {
        User.findOne({ 'local.email': email.toLowerCase() }).select('local.password').exec((err, user) => { // manner of selecting select: false fields
            if (err) return done(err);
            if (!user) return done(null, false, req.flash('loginMessage', 'Incorrect email/password or account does not exist.'));
            else {
                user.comparePassword(password, (err, isMatch) => {
                    if (err) throw err;
                    if (!isMatch) return done(null, false, req.flash('loginMessage', 'Incorrect email/password or account does not exist.'));
                    else return done(null, user);
                });
            }
        });
    }));
};

