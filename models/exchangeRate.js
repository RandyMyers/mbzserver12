// models/exchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true, // Ensure currency codes are uppercase (e.g., USD, EUR)
  },
  targetCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0, // Ensure the rate is non-negative
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

exchangeRateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);