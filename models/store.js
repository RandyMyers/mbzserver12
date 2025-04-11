const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Store Schema
const StoreSchema = new Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  name: {
    type: String,
    required: true, // Ensure the store has a name
    trim: true,
  },
  websiteLogo: {
    type: String, // URL for the website logo
    required: false, // Make it optional initially
    default: null,
  },
  platformType: {
    type: String,
    enum: ['woocommerce', 'shopify', 'magento', 'bigcommerce', 'custom'], // Allowed values
    default: 'woocommerce', // Default to WooCommerce for now
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
   
  },
  apiKey: {
    type: String,
    required: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  lastSyncDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

 
},{ timestamps: true });

// Create Store Model
const Store = mongoose.model('Store', StoreSchema);
module.exports = Store;
