const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    dealTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true, // The value of the deal (e.g., total amount)
    },
    dealStage: {
      type: String,
      enum: ['New', 'Discovery', 'Negotiation', 'Won', 'Lost'],
      default: 'New', // Default deal stage
    },
    startDate: {
      type: Date,
      required: true, // The date when the deal was initiated
    },
    endDate: {
      type: Date, // Optional: The expected or actual end date for the deal
    },
    createdBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model who is handling the deal
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model who is handling the deal
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // Reference to the Customer model
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization', // Reference to the Organization that owns the deal
      required: true,
    },
    notes: [String], // Optional notes related to the deal
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

// Update the updatedAt field when the deal is modified
dealSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
