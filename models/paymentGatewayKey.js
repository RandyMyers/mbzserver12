const mongoose = require('mongoose');

const paymentGatewayKeySchema = new mongoose.Schema({
  name:{
    type:String,
  },
  description:{
    type:String,
  },
  logoUrl:{
    type:String,
  },
  
  type: {
    type: String,
    enum: ['flutterwave', 'paystack', 'crypto', 'squad'],
    required: true,
    unique: true, // Only one per gateway type
  },
  publicKey: {
    type: String,
    required: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

paymentGatewayKeySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PaymentGatewayKey', paymentGatewayKeySchema); 