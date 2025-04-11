const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User who initiated the email
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization", // Reference to the Organization associated with the email
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    emailTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate', // Reference to the EmailTemplate model
    },
    senderEmails: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sender', // Reference to the SenderEmail model
      },
    ],
    contactsClicked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', // Reference to the Contact model
      },
    ],
    contactsOpened: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', // Reference to the Contact model
      },
    ],
    targetContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', // Reference to the Contact model
      },
    ],
    targetCategories: [
      {
        type: String, // Target contacts by categories
        trim: true,
      },
    ],
    campaignLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignLog', // Reference to the CampaignLog model
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'paused', 'completed'],
      default: 'draft',
    },
    scheduledAt: {
      type: Date, // Schedule for sending
    },
    sentAt: {
      type: Date, // Date when the campaign was actually sent
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    sentCount: {
      type: Number,
      default: 0, // Tracks the number of emails sent
    },
    deliveredCount: {
      type: Number,
      default: 0, // Tracks the number of emails delivered
    },
    bouncedCount: {
      type: Number,
      default: 0, // Tracks the number of bounced emails
    },
    unSubscribedCount: {
      type: Number,
      default: 0, // Tracks the number of unsubscribed emails
    },
    repliedCount: {
      type: Number,
      default: 0, // Tracks the number of replies received
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
