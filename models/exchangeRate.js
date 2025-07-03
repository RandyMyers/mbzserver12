// models/exchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true // Add index for better query performance
  },
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
  isCustom: {
    type: Boolean,
    default: false, // User-defined vs system rates
  },
  source: {
    type: String,
    enum: ['system', 'user', 'api'],
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index for efficient queries
exchangeRateSchema.index({ organizationId: 1, baseCurrency: 1, targetCurrency: 1 }, { unique: true });

exchangeRateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);