'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user');

const bookSchema = new mongoose.Schema({
  title           : { type: String, required: true },
  dateAdded       : { type: Date, required: true },
  currentOwner    : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tradeRequests   : [ { by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
                    { trading: { type: Schema.Types.ObjectId, ref: 'Book' } } ],
  completedTrades : [ { transaction: 
                       {
                         from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                         to: { type: Schema.Types.ObjectId, ref: 'User', required: true  },
                         time: { type: Date, required: true } 
                       } 
                    } ]
});

module.exports = mongoose.model('Book', bookSchema);
