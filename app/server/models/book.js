'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');

const bookSchema = new mongoose.Schema({
  title           : { type: String, required: true },
  author          : [ { type: String, required: true } ],
  ISBN_10         : { type: Number },
  ISBN_13         : { type: Number },
  currentOwner    : { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tradeRequest    : { requester: { type: Schema.Types.ObjectId, ref: 'User' },
                      offering: { type: Schema.Types.ObjectId, ref: 'Book' } },
  completedTrades : [ { transaction: {
                         requester: { type: Schema.Types.ObjectId, ref: 'User' },
                         offering: { type: Schema.Types.ObjectId, ref: 'Book' },
                         requestee: { type: Schema.Types.ObjectId, ref: 'User' },
                         dateOfSwap: { type: Date, required: true }
                    } } ]
});

module.exports = mongoose.model('Book', bookSchema);
