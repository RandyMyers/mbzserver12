const mongoose = require('mongoose');

const receiverSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization', // Reference to the Organization associated with this receiver email
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User who integrated this receiver email
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
    imapHost: {
      type: String,
      required: true,
    },
    imapPort: {
      type: Number,
      required: true,
      default: 993, // IMAP default secure port
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    useTLS: {
      type: Boolean,
      default: true, // Whether to use TLS for IMAP connection
    },
    maxEmailsPerFetch: {
      type: Number,
      default: 50, // Example default limit for number of emails fetched per request
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastFetchedAt: {
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

// Method to deactivate the receiver
receiverSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

const Receiver = mongoose.model('Receiver', receiverSchema);

module.exports = Receiver;
