const Email = require("../models/emails"); // Import the Email model
const EmailLogs = require("../models/emailLogs");
const logEvent = require('../helper/logEvent');

// CREATE a new email
exports.createEmail = async (req, res) => {
  try {
    const { recipient, subject, body, variables, emailTemplate, createdBy, organization } = req.body;

    const newEmail = new Email({
      recipient,
      subject,
      body,
      variables,
      emailTemplate,
      createdBy,
      organization,
    });

    const savedEmail = await newEmail.save();
    await logEvent({
      action: 'create_email',
      user: req.user._id,
      resource: 'Email',
      resourceId: savedEmail._id,
      details: { to: savedEmail.recipient, subject: savedEmail.subject },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, email: savedEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create email" });
  }
};

// GET all emails
exports.getAllEmails = async (req, res) => {
  try {
    const emails = await Email.find()
      .populate("createdBy organization emailTemplate", "name emailTemplateName") // Populate fields with related data
      .exec();
    res.status(200).json({ success: true, emails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve emails" });
  }
};

// GET a single email by ID
exports.getEmailById = async (req, res) => {
  const { emailId } = req.params;
  try {
    const email = await Email.findById(emailId)
      .populate("createdBy organization emailTemplate", "name emailTemplateName")
      .exec();
    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }
    res.status(200).json({ success: true, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email" });
  }
};

// GET emails by status
exports.getEmailsByStatus = async (req, res) => {
    const { status } = req.params;
    console.log(status);
  
    // Validate status input
    const validStatuses = ["inbox", "sent", "archived", "trash", "drafts","outbox", "scheduled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }
  
    try {
      const emails = await Email.find({ status })
        .populate("createdBy organization emailTemplate", "name emailTemplateName")
        .exec();
  
      res.status(200).json({ success: true, emails });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to retrieve emails by status" });
    }
  };
  

// UPDATE an existing email
exports.updateEmail = async (req, res) => {
  const { emailId } = req.params;
  const { recipient, subject, body, variables, emailTemplate, status, bounceReason, unsubscribed, replied, sentAt } = req.body;

  try {
    const updatedEmail = await Email.findByIdAndUpdate(
      emailId,
      { recipient, subject, body, variables, emailTemplate, status, bounceReason, unsubscribed, replied, sentAt, updatedAt: Date.now() },
      { new: true } // return the updated email
    );

    if (!updatedEmail) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    await logEvent({
      action: 'update_email',
      user: req.user._id,
      resource: 'Email',
      resourceId: updatedEmail._id,
      details: { to: updatedEmail.recipient, subject: updatedEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, email: updatedEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email" });
  }
};

// DELETE an email
exports.deleteEmail = async (req, res) => {
  const { emailId } = req.params;
  try {
    const deletedEmail = await Email.findByIdAndDelete(emailId);
    if (!deletedEmail) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }
    await logEvent({
      action: 'delete_email',
      user: req.user._id,
      resource: 'Email',
      resourceId: deletedEmail._id,
      details: { to: deletedEmail.recipient, subject: deletedEmail.subject },
      organization: req.user.organization
    });
    res.status(200).json({ success: true, message: "Email deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email" });
  }
};

// Example: Add a function to log analytics info (to be called from webhook or tracking pixel endpoint)
exports.logEmailAnalytics = async (req, res) => {
  try {
    const { emailId, status, deviceType, client, country } = req.body;
    const log = new EmailLogs({
      emailId,
      status,
      deviceType,
      client,
      country,
      sentAt: status === 'sent' ? new Date() : undefined,
    });
    await log.save();
    res.status(201).json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

