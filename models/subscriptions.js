const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true,
  },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'], // Match options in SubscriptionPlan
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date, // Calculate based on billingCycle
  },
  renewalDate: {
    type: Date, // Next renewal date for recurring subscriptions
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
  trialPeriodUsed: {
    type: Boolean,
    default: false, // Tracks if the user has used the trial period
  },
  canceledAt: {
    type: Date, // Date when the subscription was canceled
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
