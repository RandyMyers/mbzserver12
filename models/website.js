// models/Website.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const websiteSchema = new Schema({
  // Organization reference
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },

  // Basic Information (Step 1)
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: [
      'Fashion & Apparel',
      'Electronics & Gadgets',
      'Food & Beverages',
      'Home & Furniture',
      'Health & Beauty',
      'Sports & Fitness',
      'Books & Media',
      'Art & Crafts',
      'Services',
      'Other'
    ]
  },
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Domain can only contain letters, numbers, and hyphens']
  },
  description: {
    type: String,
    required: [true, 'Business description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Logo Setup
  logo: {
    url: String,
    publicId: String,
    originalName: String
  },
  needLogoDesign: {
    type: Boolean,
    default: false
  },
  logoDesignNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Logo design notes cannot exceed 500 characters']
  },
  logoDesignPreferences: {
    style: {
      type: String,
      enum: [
        'Minimal',
        'Vintage',
        'Modern',
        'Handwritten',
        '3D',
        'Flat',
        'Illustrative',
        'Other'
      ],
      default: 'Modern'
    },
    colorScheme: [{
      type: String,
      match: [/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color format']
    }],
    includeIcon: {
      type: Boolean,
      default: false
    },
    includeText: {
      type: Boolean,
      default: true
    },
    inspirationLinks: [{
      type: String,
      match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'Please enter a valid URL']
    }]
  },

  // Template Selection (Step 2) required: [true, 'Template selection is required']
  template: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    
  },
  
  // Color Customization
  primaryColor: {
    type: String,
    default: '#800020' // Burgundy
  },
  secondaryColor: {
    type: String,
    default: '#0A2472' // Navy
  },
  complementaryColor: {
    type: String,
    default: '#e18d01' // Gold
  },

  // Business Information & Legal (Step 3)
  businessAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Business address cannot exceed 500 characters']
  },
  businessContactInfo: {
    type: String,
    trim: true,
    maxlength: [500, 'Contact information cannot exceed 500 characters']
  },
  supportEmail: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  termsConditions: {
    type: String,
    trim: true
  },
  privacyPolicy: {
    type: String,
    trim: true
  },

  // Email Configuration (Step 4)
  customEmails: [{
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9._-]+$/, 'Email name can only contain letters, numbers, dots, hyphens and underscores']
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Purpose cannot exceed 100 characters']
    }
  }],

  // Store Configuration
  paymentGateways: [{
    name: String,
    isEnabled: Boolean,
    credentials: Object,
    createdAt: Date
  }],
  shippingOptions: [{
    name: String,
    description: String,
    price: Number,
    deliveryTime: String,
    isEnabled: Boolean
  }],
  taxSettings: {
    rate: Number,
    isIncludedInPrice: Boolean,
    taxId: String
  },

  // SEO & Social
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title cannot exceed 60 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters']
    },
    metaTags: [String]
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },

  // Final Details
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters']
  },

  // System Fields
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'development', 'live', 'inactive'],
    default: 'draft'
  },
  hasSSL: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable virtuals to be included in toJSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
websiteSchema.index({ domain: 1 }, { unique: true });
websiteSchema.index({ organization: 1 });
websiteSchema.index({ owner: 1 });

// Virtuals
websiteSchema.virtual('fullDomain').get(function() {
  return `${this.domain}.storepilot.com`;
});

// Generate email addresses from customEmails
websiteSchema.virtual('emailAddresses').get(function() {
  return this.customEmails.map(email => ({
    fullAddress: `${email.email}@${this.domain}.storepilot.com`,
    purpose: email.purpose
  }));
});

module.exports = mongoose.model('Website', websiteSchema);