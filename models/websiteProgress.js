// models/WebsiteProgress.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const websiteProgressSchema = new Schema({
  website: {
    type: Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },
  
  // Design Progress Tracking
  currentStep: {
    type: String,
    enum: ['initial', 'logo', 'template', 'content', 'review', 'development', 'testing', 'launch'],
    default: 'initial'
  },
  
  completedSteps: [{
    step: String,
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  notes: [{
    text: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  assets: [{
    type: {
      type: String,
      enum: ['image', 'document', 'mockup', 'other']
    },
    url: String,
    description: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Designer Assignments
  assignedDesigners: [{
    designer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'reviewer']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Milestones & Deadlines
  milestones: [{
    name: String,
    description: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  // Approval Tracking
  approvals: [{
    type: {
      type: String,
      enum: ['logo', 'design', 'content', 'final']
    },
    approved: Boolean,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    comments: String
  }],
  
  // Version History
  versions: [{
    versionNumber: String,
    changes: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    snapshot: Object
  }],
  
  // Client Feedback
  feedback: [{
    type: {
      type: String,
      enum: ['general', 'design', 'content', 'functionality']
    },
    text: String,
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'addressed', 'rejected'],
      default: 'pending'
    },
    response: String
  }],
  
  // Quality Assurance
  qaChecks: [{
    checkType: String,
    passed: Boolean,
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    notes: String
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

websiteProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WebsiteProgress', websiteProgressSchema);