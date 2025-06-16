const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
  },
  gateway: {
    type: String,
    enum: ['flutterwave', 'paystack', 'squad', 'bank', 'crypto'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'NGN', 'BTC', 'USDT'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'manual_review'],
    default: 'pending',
  },
  reference: {
    type: String,
    required: true,
    unique: true,
  },
  paymentData: {
    type: Object,
    default: {},
  },
  screenshotUrl: {
    type: String, // For bank transfer screenshot
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

paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 