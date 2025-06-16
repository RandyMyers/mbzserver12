const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralSchema = new Schema({
  affiliateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Affiliate', 
    required: true 
  },
  referredUserId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'converted', 'cancelled'],
    default: 'pending'
  },
  conversionValue: { 
    type: Number,
    default: 0
  },
  commission: { 
    type: Number,
    default: 0
  },
  trackingCode: { 
    type: String,
    required: true
  },
  source: { 
    type: String,
    enum: ['link', 'code', 'other'],
    default: 'link'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    landingPage: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  convertedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
referralSchema.index({ affiliateId: 1, status: 1 });
referralSchema.index({ trackingCode: 1 }, { unique: true });
referralSchema.index({ createdAt: -1 });

// Methods
referralSchema.methods.convert = async function(conversionValue) {
  if (this.status !== 'pending') {
    throw new Error('Referral is not in pending status');
  }
  
  this.status = 'converted';
  this.conversionValue = conversionValue;
  this.convertedAt = new Date();
  
  // Calculate commission based on affiliate's rate
  const affiliate = await mongoose.model('Affiliate').findById(this.affiliateId);
  this.commission = (conversionValue * affiliate.commissionRate) / 100;
  
  await this.save();
  
  // Update affiliate's pending earnings
  await affiliate.updateEarnings(this.commission);
  
  return this;
};

referralSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending referrals can be cancelled');
  }
  
  this.status = 'cancelled';
  await this.save();
  
  return this;
};

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral; 