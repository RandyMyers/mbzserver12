const mongoose = require('mongoose');

const campaignLogSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign', // Reference to the Campaign
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Reference to the Customer
      required: true,
    },
    eventType: {
      type: String,
      enum: ['open', 'click', 'error'], // Event types for the log entry
      required: true,
    },
    eventDetails: {
      type: String, // Details about the event (e.g., clicked link URL)
    },
    errorDetails: {
      type: String, // Error message (if the event is an error)
    },
    timestamp: {
      type: Date,
      default: Date.now, // When the event occurred
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const CampaignLog = mongoose.model('CampaignLog', campaignLogSchema);

module.exports = CampaignLog;
