const Inbox = require("../models/inbox"); // Import the Inbox model

// CREATE a new email in the inbox (e.g., when receiving an email)
exports.createInboxEmail = async (req, res) => {
  try {
    const { sender, subject, body, replyTo, status, organization, user } = req.body;

    const newInboxEmail = new Inbox({
      sender,
      subject,
      body,
      replyTo,
      status,
      organization,
      user,
    });

    const savedInboxEmail = await newInboxEmail.save();
    res.status(201).json({ success: true, inboxEmail: savedInboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create inbox email" });
  }
};

// GET all emails in the inbox for a specific user
exports.getAllInboxEmails = async (req, res) => {
  
  try {
    const inboxEmails = await Inbox.find()
      .populate("sender replyTo organization", "name") // Populate relevant fields
      .exec();

      console.log(inboxEmails);
      
    res.status(200).json({ success: true, inboxEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox emails" });
  }
};

// GET a specific email from the inbox by ID
exports.getInboxEmailById = async (req, res) => {
  const { inboxEmailId } = req.params;
  try {
    const inboxEmail = await Inbox.findById(inboxEmailId)
      .populate("sender replyTo organization", "name")
      .exec();
    if (!inboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }
    res.status(200).json({ success: true, inboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox email" });
  }
};

// UPDATE the status of an email (e.g., mark as read or archived)
exports.updateInboxEmailStatus = async (req, res) => {
  const { inboxEmailId } = req.params;
  const { status } = req.body; // status can be "unread", "read", or "archived"

  try {
    const updatedInboxEmail = await Inbox.findByIdAndUpdate(
      inboxEmailId,
      { status, updatedAt: Date.now() },
      { new: true } // return the updated inbox email
    );

    if (!updatedInboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }

    res.status(200).json({ success: true, inboxEmail: updatedInboxEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update inbox email status" });
  }
};

// DELETE an email from the inbox
exports.deleteInboxEmail = async (req, res) => {
  const { inboxEmailId } = req.params;
  try {
    const deletedInboxEmail = await Inbox.findByIdAndDelete(inboxEmailId);
    if (!deletedInboxEmail) {
      return res.status(404).json({ success: false, message: "Inbox email not found" });
    }
    res.status(200).json({ success: true, message: "Inbox email deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete inbox email" });
  }
};

// GET all emails in the inbox for a specific organization
exports.getInboxEmailsByOrganization = async (req, res) => {
  const organizationId = req.query.organizationId || req.params.organizationId;
  if (!organizationId) {
    return res.status(400).json({ success: false, message: "organizationId is required" });
  }
  try {
    const inboxEmails = await Inbox.find({ organization: organizationId })
      .populate("sender replyTo organization", "name")
      .exec();

      console.log(inboxEmails);
    res.status(200).json({ success: true, inboxEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve inbox emails by organization" });
  }
};
