const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
  },
  billingInterval: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
    default: 'monthly',
  },
  currency: {
    type: String,
    enum: ['USD', 'NGN', 'EUR', 'GBP'],
    required: true,
    default: 'USD',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  renewalDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed'],
    default: 'Pending',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'canceled', 'expired'],
    default: 'active',
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  canceledAt: {
    type: Date,
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

subscriptionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
