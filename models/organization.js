const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// models/Organization.js
const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  organizationCode: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  logoUrl:{
    type: String,
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  
  businessType: {
    type: String,
    required: true,
    enum: [
      'Clothing and Apparel',
      'Food and Beverages',
      'Electronics',
      'Health and Beauty',
      'Education',
      'Finance',
      'Technology',
      'Other',
    ], // Add business categories here
    default: 'Other',
  },
  defaultCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)'
    }
  },
  analyticsCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, NGN)'
    }
  },
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Subscription' }], // Link subscriptions
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

OrganizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
