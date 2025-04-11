const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  billingCycle: {
    type: String,
    enum: ["Monthly", "Quarterly", "Half-yearly", "Yearly"], // Added 'half-yearly'
    required: true,
  },
  features: [{ type: String }], // Array of features
  metadata: { type: Map, of: String },
  userLimit: { type: Number, default: null }, // Default user limit
  storageLimit: { type: Number, default: null }, // Default storage limit in MB/GB
  trialPeriod: { type: Boolean, default: false },
  trialDuration: { type: Number, default: 0 }, // Default trial duration in days
  emailAccountLimit: { type: Number, default: null }, // Number of email accounts allowed
  storeLimit: { type: Number, default: null }, // Number of stores allowed
  woocommerceIntegration: { type: Boolean, default: false }, // WooCommerce integration flag
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
