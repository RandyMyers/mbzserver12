const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marketingMaterialSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['banner', 'video', 'document', 'link'],
    required: true
  },
  url: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'],
    default: 'active'
  },
  metadata: {
    size: String,
    format: String,
    dimensions: String,
    duration: Number,
    fileSize: Number,
    mimeType: String
  },
  tags: [String],
  category: {
    type: String,
    enum: ['social', 'email', 'website', 'print', 'other'],
    default: 'other'
  },
  usage: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
marketingMaterialSchema.index({ status: 1, type: 1 });
marketingMaterialSchema.index({ tags: 1 });
marketingMaterialSchema.index({ createdAt: -1 });

// Methods
marketingMaterialSchema.methods.trackView = async function() {
  this.usage.views += 1;
  await this.save();
};

marketingMaterialSchema.methods.trackClick = async function() {
  this.usage.clicks += 1;
  await this.save();
};

marketingMaterialSchema.methods.trackConversion = async function() {
  this.usage.conversions += 1;
  await this.save();
};

// Static methods
marketingMaterialSchema.statics.getActiveMaterials = async function(type = null) {
  const query = { status: 'active' };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ createdAt: -1 });
};

marketingMaterialSchema.statics.getByCategory = async function(category) {
  return this.find({
    status: 'active',
    category
  }).sort({ createdAt: -1 });
};

marketingMaterialSchema.statics.getByTags = async function(tags) {
  return this.find({
    status: 'active',
    tags: { $in: tags }
  }).sort({ createdAt: -1 });
};

const MarketingMaterial = mongoose.model('MarketingMaterial', marketingMaterialSchema);

module.exports = MarketingMaterial; 