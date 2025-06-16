const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const affiliateSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'suspended', 'terminated'],
    default: 'pending'
  },
  commissionRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe'],
      required: true
    },
    bankName: String,
    accountNumber: String,
    accountName: String,
    swiftCode: String,
    paypalEmail: String,
    stripeAccountId: String
  },
  trackingCode: { 
    type: String, 
    required: true,
    unique: true
  },
  marketingMaterials: [{
    type: Schema.Types.ObjectId,
    ref: 'MarketingMaterial'
  }],
  performance: {
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  settings: {
    minimumPayout: { type: Number, default: 1000 },
    autoPayout: { type: Boolean, default: false },
    notifications: {
      newReferral: { type: Boolean, default: true },
      conversion: { type: Boolean, default: true },
      payout: { type: Boolean, default: true }
    }
  },
  metadata: {
    website: String,
    socialMedia: [String],
    description: String,
    categories: [String],
    languages: [String]
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ trackingCode: 1 });
affiliateSchema.index({ 'earnings.total': -1 });

// Methods
affiliateSchema.methods.updateEarnings = async function(amount) {
  this.earnings.total += amount;
  this.earnings.pending += amount;
  await this.save();
};

affiliateSchema.methods.processPayout = async function(amount) {
  if (amount > this.earnings.pending) {
    throw new Error('Insufficient pending earnings');
  }
  
  this.earnings.pending -= amount;
  this.earnings.paid += amount;
  await this.save();
};

affiliateSchema.methods.updatePerformance = async function() {
  const Referral = mongoose.model('Referral');
  
  const stats = await Referral.aggregate([
    {
      $match: {
        affiliateId: this._id
      }
    },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        activeReferrals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'converted'] }, 1, 0]
          }
        },
        totalValue: { $sum: '$conversionValue' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const { totalReferrals, activeReferrals, totalValue } = stats[0];
    
    this.performance.totalReferrals = totalReferrals;
    this.performance.activeReferrals = activeReferrals;
    this.performance.conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
    this.performance.averageOrderValue = activeReferrals > 0 ? totalValue / activeReferrals : 0;
    
    await this.save();
  }
};

// Static methods
affiliateSchema.statics.getTopPerformers = async function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'earnings.total': -1 })
    .limit(limit);
};

affiliateSchema.statics.getPendingPayouts = async function() {
  return this.find({
    status: 'active',
    'earnings.pending': { $gte: '$settings.minimumPayout' }
  });
};

const Affiliate = mongoose.model('Affiliate', affiliateSchema);

module.exports = Affiliate; 