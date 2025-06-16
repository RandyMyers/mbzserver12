const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commissionSchema = new Schema({
  affiliateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Affiliate', 
    required: true 
  },
  referralId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Referral', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  payoutId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Payout' 
  },
  metadata: {
    conversionValue: Number,
    commissionRate: Number,
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  paidAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
commissionSchema.index({ affiliateId: 1, status: 1 });
commissionSchema.index({ referralId: 1 }, { unique: true });
commissionSchema.index({ createdAt: -1 });

// Methods
commissionSchema.methods.markAsPaid = async function(payoutId) {
  if (this.status !== 'pending') {
    throw new Error('Commission is not in pending status');
  }
  
  this.status = 'paid';
  this.payoutId = payoutId;
  this.paidAt = new Date();
  
  await this.save();
  
  return this;
};

commissionSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending commissions can be cancelled');
  }
  
  this.status = 'cancelled';
  await this.save();
  
  // Update affiliate's pending earnings
  const affiliate = await mongoose.model('Affiliate').findById(this.affiliateId);
  affiliate.pendingEarnings -= this.amount;
  await affiliate.save();
  
  return this;
};

// Static methods
commissionSchema.statics.getPendingCommissions = async function(affiliateId) {
  return this.find({
    affiliateId,
    status: 'pending'
  }).sort({ createdAt: -1 });
};

commissionSchema.statics.getTotalPendingAmount = async function(affiliateId) {
  const result = await this.aggregate([
    {
      $match: {
        affiliateId: mongoose.Types.ObjectId(affiliateId),
        status: 'pending'
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

const Commission = mongoose.model('Commission', commissionSchema);

module.exports = Commission; 