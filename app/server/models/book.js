'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');

const bookSchema = new mongoose.Schema({
  title           : { type: String, required: true },
  author          : [ { type: String, required: true } ],
  description     : { type: String },
  thumbnail       : { type: String },
  link            : { type: String },
  ISBN_10         : { type: String },
  ISBN_13         : { type: String },
  dateAdded       : { type: Date, default: Date.now, required: true },
  currentOwner    : { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactionLock : { type: Boolean, default: false, required: true }
});

module.exports = mongoose.model('Book', bookSchema);
