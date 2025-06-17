const mongoose = require("mongoose");

const ArchivedSchema = new mongoose.Schema(
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
      enum: ["archived"],
      default: "archived",
    },
    archivedAt: {
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
      enum: ["inbox", "sent", "drafts", "outbox"],
      required: true,
    },
    attachments: [{
      filename: String,
      path: String,
      mimetype: String,
      size: Number
    }],
    recipients: [{
      type: String,
      trim: true,
    }],
    cc: [{
      type: String,
      trim: true,
    }],
    bcc: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Archived", ArchivedSchema); 