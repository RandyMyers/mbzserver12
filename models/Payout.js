const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payoutSchema = new Schema({
  affiliateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Affiliate', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: { 
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    reference: String,
    bankName: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String,
    notes: String
  },
  commissionIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Commission' 
  }],
  metadata: {
    currency: {
      type: String,
      default: 'NGN'
    },
    exchangeRate: Number,
    fees: Number,
    netAmount: Number
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

// Indexes for better query performance
payoutSchema.index({ affiliateId: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

// Methods
payoutSchema.methods.process = async function() {
  if (this.status !== 'pending') {
    throw new Error('Payout is not in pending status');
  }
  
  this.status = 'processing';
  this.processedAt = new Date();
  
  // Update commissions status
  await mongoose.model('Commission').updateMany(
    { _id: { $in: this.commissionIds } },
    { $set: { status: 'paid', payoutId: this._id } }
  );
  
  await this.save();
  
  return this;
};

payoutSchema.methods.complete = async function(transactionId) {
  if (this.status !== 'processing') {
    throw new Error('Payout is not in processing status');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  this.paymentDetails.transactionId = transactionId;
  
  // Update affiliate's earnings
  const affiliate = await mongoose.model('Affiliate').findById(this.affiliateId);
  await affiliate.processPayout(this.amount);
  
  await this.save();
  
  return this;
};

payoutSchema.methods.fail = async function(reason) {
  if (this.status !== 'processing') {
    throw new Error('Payout is not in processing status');
  }
  
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  
  // Revert commission status
  await mongoose.model('Commission').updateMany(
    { _id: { $in: this.commissionIds } },
    { $set: { status: 'pending', payoutId: null } }
  );
  
  await this.save();
  
  return this;
};

// Static methods
payoutSchema.statics.getPendingPayouts = async function(affiliateId) {
  return this.find({
    affiliateId,
    status: 'pending'
  }).sort({ createdAt: -1 });
};

payoutSchema.statics.getTotalPaidAmount = async function(affiliateId) {
  const result = await this.aggregate([
    {
      $match: {
        affiliateId: mongoose.Types.ObjectId(affiliateId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  return result[0]?.total || 0;
};

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = Payout; 