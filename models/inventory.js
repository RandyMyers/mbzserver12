const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Schema for WooCommerce integration
const InventorySchema = new Schema({
  // WooCommerce Product ID and SKU
  product_Id: { type: Number, required: true },
  sku: { type: String, required: true },

  // Basic Information
  name: { type: String, required: true },
  description: { type: String, default: null },
  short_description: { type: String, default: null }, // Short description
  price: { type: Number, default: null },
  sale_price: { type: Number, default: null },
  regular_price: { type: Number, default: null },
  date_on_sale_from: { type: Date, default: null },
  date_on_sale_to: { type: Date, default: null },
  on_sale: { type: Boolean, default: false },
  purchasable: { type: Boolean, default: true },
  total_sales: { type: Number, default: 0 },
  status: { type: String, required: true }, // e.g., publish, draft
  featured: { type: Boolean, default: false },
  catalog_visibility: { type: String, default: "visible" },

  // Stock Management
  manage_stock: { type: Boolean, default: false },
  stock_quantity: { type: Number, default: null },
  stock_status: { type: String, default: "instock" },
  backorders: { type: String, default: "no" },
  backorders_allowed: { type: Boolean, default: false },

  // Shipping Information
  weight: { type: String, default: null },
  dimensions: {
    length: { type: String, default: null },
    width: { type: String, default: null },
    height: { type: String, default: null },
  },
  shipping_required: { type: Boolean, default: true },
  shipping_taxable: { type: Boolean, default: true },
  shipping_class: { type: String, default: null },
  shipping_class_id: { type: Number, default: null },

  // Product Categorization
  categories: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  }],
  tags: [{
    name: { type: String, default: null },
  }],

  // Product Images
  images: [{
    id: { type: Number, required: true },
    date_created: { type: Date, required: true },
    src: { type: String, required: true }, // Image URL
    alt: { type: String, default: null },
  }],

  // Ratings and Reviews
  average_rating: { type: String, default: "0.00" },
  rating_count: { type: Number, default: 0 },
  reviews_allowed: { type: Boolean, default: true },

  // WooCommerce Links
  permalink: { type: String, required: true },
  slug: { type: String, required: true },

  // WooCommerce Product Type
  type: { type: String, required: true },
  external_url: { type: String, default: "" },
  button_text: { type: String, default: "" },

  // Related Products
  upsell_ids: [{ type: Number, default: null }],
  cross_sell_ids: [{ type: Number, default: null }],
  related_ids: [{ type: Number, default: null }],

  // Purchase Notes and Grouping
  purchase_note: { type: String, default: "" },
  sold_individually: { type: Boolean, default: false },
  grouped_products: [{ type: Number, default: null }],
  menu_order: { type: Number, default: 0 },

  // Timestamps
  date_created: { type: Date, required: true },
  date_modified: { type: Date, required: true },

  // References to Other Models
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
});

const Inventory = mongoose.model('Inventory', InventorySchema);
module.exports = Inventory;
