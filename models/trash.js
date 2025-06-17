const mongoose = require("mongoose");

const TrashSchema = new mongoose.Schema(
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
      ref: "Email",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
    emailLogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailLogs",
    }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    originalFolder: {
      type: String,
      enum: ["inbox", "sent", "drafts", "outbox", "archived"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trash", TrashSchema); 