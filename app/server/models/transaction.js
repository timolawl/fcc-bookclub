'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');
const Book = require('./book');

const transactionSchema = new mongoose.Schema({
  requester     : { type: Schema.Types.ObjectId, ref: 'User' }, // if requester,
  bookRequested : { type: Schema.Types.ObjectId, ref: 'Book' }, // show under books I want
  requestee     : { type: Schema.Types.ObjectId, ref: 'User' }, // if requestee,
  bookOffered   : { type: Schema.Types.ObjectId, ref: 'Book' }, // show under books others want
  dateOfRequest : { type: Date, default: Date.now },
  dateOfSwap    : { type: Date } // basically if there is a value here, then it's completed
  // if completed, show them under same category for the completed page but: want -> wanted
});

module.exports = mongoose.model('Transaction', transactionSchema);
