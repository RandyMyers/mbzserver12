const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model, indicating the recipient of the notification
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate', // Reference to the NotificationTemplate that was used for this notification
      required: true,
    },
    subject: {
      type: String,
      required: true, // Subject of the notification (can be email subject or message header)
    },
    body: {
      type: String,
      required: true, // Body content of the notification
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'read'], // Notification status (pending, sent, failed, read)
      default: 'pending', // Default to pending if no status is provided
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'system'], // Type of notification (email, SMS, etc.)
      required: true,
    },
    deliveryAttemptCount: {
      type: Number,
      default: 0, // Number of times the system attempted to deliver the notification
    },
    deliveryStatus: {
      type: String,
      enum: ['success', 'failure'], // Whether the delivery was successful or not
      default: 'failure', // Default to failure
    },
    sentAt: {
      type: Date, // Timestamp when the notification was sent
    },
    errorMessage: {
      type: String, // Error message in case of failure (e.g., if sending email fails)
    },
    
    createdAt: {
      type: Date,
      default: Date.now, // Timestamp when the notification record was created
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Timestamp for when the notification record was last updated
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Update the updatedAt field before saving
notificationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to mark a notification as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
