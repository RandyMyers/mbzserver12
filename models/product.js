const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  subscriptionPlans: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" }
  ], // References to SubscriptionPlan
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", ProductSchema);
