const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
      },
  customer_id: {
    type: Number,
    required: true,
    
  },
  customer_ip_address: {
    type: String,
  },
  date_created: {
    type: Date,
  },
  date_created_gmt: {
    type: Date,
  },
  date_modified: {
    type: Date,
  },
  date_modified_gmt: {
    type: Date,
  },
  email: {
    type: String,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  role: {
    type: String,
  },
  username: {
    type: String,
  },
  billing: {
    first_name: String,
    last_name: String,
    company: String,
    address_1: String,
    address_2: String,
    city: String,
    state: String,
    postcode: String,
    country: String,
    email: String,
    phone: String,
  },
  shipping: {
    first_name: String,
    last_name: String,
    company: String,
    address_1: String,
    address_2: String,
    city: String,
    state: String,
    postcode: String,
    country: String,
  },
  is_paying_customer: {
    type: Boolean,
    default: false,
  },
  avatar_url: {
    type: String,
  },
  meta_data: [{
    key: String,
    value: mongoose.Schema.Types.Mixed,
  }],
  _links: {
    self: [{
      href: {
        type: String,
        
      },
    }],
    collection: [{
      href: {
        type: String,
        
      },
    }],
  },
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
