const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  features: [
    {
      type: String,
    },
  ],
  price: {
    type: Number,
  },
  currency: {
    type: String,
    enum: ['USD', 'NGN', 'EUR', 'GBP'],
    default: 'USD',
  },
  billingInterval: {
    type: String,
    enum: ['monthly','Quarterly', 'yearly'],
    required: true,
    default: 'monthly',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
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

subscriptionPlanSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
