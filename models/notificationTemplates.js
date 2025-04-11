const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: true,
      trim: true, // Ensure no extra spaces in the template name
    },
    subject: {
      type: String,
      required: true, // Subject for the notification (can be used for email or other channels)
    },
    body: {
      type: String,
      required: true, // Body of the notification (could be email body or message content)
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'system'], // Different notification types
      required: true, // Notification type (e.g., email, SMS, system message)
    },
    triggerEvent: {
      type: String,
      enum: ['subscriptionEnd', 'reminder', 'invoiceCreated', 'accountUpdate', 'custom'], // Types of events that trigger the notification
      required: true,
    },
    variables: {
      type: Map,
      of: String, // To handle dynamic placeholders like user name, subscription date, etc.
      default: {} // Empty map by default
    },
    isActive: {
      type: Boolean,
      default: true, // Whether the template is active and should be used
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model who created the template
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // Timestamp when the template was created
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Timestamp when the template was last updated
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Update the updatedAt field before saving
notificationTemplateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

module.exports = NotificationTemplate;
