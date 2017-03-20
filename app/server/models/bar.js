'use strict';

const mongoose = require('mongoose');

const barSchema = new mongoose.Schema({
  name: { type: String, required: true }, // name of the bar
  guestList: [{ type: String, unique: true }],
  /*
  guestList: [{ _id: false,
                attendee: { type: String },
                timeOfRSVP: { type: Date, default: Date.now }}], // list of profile ids for those going need the time as well, to drop
                */
  guestCount: { type: Number, default: 0 }
//  lastActivity: Date

  //lastActivity: { type: Date }, // this can be used to move the results to the top
  // mongoose seems not to be able to remove documents on its own,
  // so the clean up must happen when the db is accessed
  
});

// barSchema.pre('save', 

module.exports = mongoose.model('Bar', barSchema);
