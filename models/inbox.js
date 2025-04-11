const mongoose = require("mongoose");

const InboxSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email", // Reference to the original email this is a reply to
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    emailLogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmailLogs", // Array of references to EmailLogs
      }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization", // Reference to the Organization receiving the email
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User associated with the inbox
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Inbox", InboxSchema);
