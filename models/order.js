const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false,
  },
  customer_Id: {
    type: String,
  },
  parent_id: {
    type: Number,
  },
  status: {
    type: String,
  },
  currency: {
    type: String,
  },
  version: {
    type: String,
  },
  prices_include_tax: {
    type: Boolean,
  },
  date_created: {
    type: Date,
  },
  date_modified: {
    type: Date,
  },
  discount_total: {
    type: String,
  },
  discount_tax: {
    type: String,
  },
  shipping_total: {
    type: String,
  },
  shipping_tax: {
    type: String,
  },
  cart_tax: {
    type: String,
  },
  total: {
    type: String,
  },
  total_tax: {
    type: String,
  },
  customer_id: {
    type: Number,
  },
  order_key: {
    type: String,
  },
  billing: {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    company: {
      type: String,
    },
    address_1: {
      type: String,
    },
    address_2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    postcode: {
      type: String,
    },
    country: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  shipping: {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    company: {
      type: String,
    },
    address_1: {
      type: String,
    },
    address_2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    postcode: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  payment_method: {
    type: String,
  },
  payment_method_title: {
    type: String,
  },
  transaction_id: {
    type: String,
  },
  customer_ip_address: {
    type: String,
  },
  customer_user_agent: {
    type: String,
  },
  created_via: {
    type: String,
  },
  customer_note: {
    type: String,
  },
  date_completed: {
    type: Date,
  },
  date_paid: {
    type: Date,
  },
  cart_hash: {
    type: String,
  },
  number: {
    type: String,
  },
  meta_data: [{
    key: {
      type: String,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    },
  }],
  line_items: [{
    product_id: {
      type: String,
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,  // Reference to Inventory
      ref: 'Inventory',
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    meta_data: [{
      key: {
        type: String,
        required: true,
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    }],
    price: {
      type: String,
      required: true,
    },
  }],
  shipping_lines: [{
    method_title: {
      type: String,
    },
    total: {
      type: String,
    },
  }],
  tax_lines: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  fee_lines: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  coupon_lines: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  refunds: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  payment_url: {
    type: String,
  },
  is_editable: {
    type: Boolean,
  },
  needs_payment: {
    type: Boolean,
  },
  needs_processing: {
    type: Boolean,
  },
  date_created_gmt: {
    type: Date,
  },
  date_modified_gmt: {
    type: Date,
  },
  date_completed_gmt: {
    type: Date,
  },
  date_paid_gmt: {
    type: Date,
  },
  currency_symbol: {
    type: String,
  },
  _links: {
    self: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    collection: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    customer: [{
      type: mongoose.Schema.Types.Mixed,
    }],
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
