const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema(
  {
    recipient: {
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
    variables: {
      type: Map,
      of: String, // Key-value pairs for dynamic variables (e.g., { userName: "John Doe" })
    },
    messageId: {
      type: String
    },
    emailTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate", // Reference to the EmailTemplate model
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign", // Reference to the EmailTemplate model
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow", // Reference to the EmailTemplate model
    },
    emailLogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailLogs", // Array of references to EmailLogs
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User who initiated the email
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization", // Reference to the Organization associated with the email
    },
    status: {
      type: String,
      enum: ["trash", "drafts", "scheduled","sent"], // Allowed values
      default: "Draft", // Default value if none is provided
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Email", EmailSchema);
