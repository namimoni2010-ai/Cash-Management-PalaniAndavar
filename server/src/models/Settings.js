const mongoose = require('mongoose');

// Single document (key = "main"). Opening balances are the balances the showroom
// started with on the first day it used this app, kept separately per payment mode.
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  openingBalances: {
    GPAY: { type: Number, default: 0, min: 0 },
    CASH: { type: Number, default: 0, min: 0 },
  },
  allowNegative: { type: Boolean, default: false },
});

module.exports = mongoose.model('Settings', settingsSchema);
