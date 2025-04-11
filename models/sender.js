const mongoose = require('mongoose');

const senderSchema = new mongoose.Schema(
  {
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization', // Reference to the Organization associated with this sender email
        
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who integrated this sender email
        required: true,
      },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    smtpHost: {
      type: String,
      required: true,
    },
    smtpPort: {
      type: Number,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    maxDailyLimit: {
      type: Number,
      default: 500, // Example default limit
    },
    emailsSentToday: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Reset emailsSentToday to 0 at midnight
senderSchema.methods.resetDailyLimit = function () {
  this.emailsSentToday = 0;
  return this.save();
};

const Sender = mongoose.model('Sender', senderSchema);

module.exports = Sender;
