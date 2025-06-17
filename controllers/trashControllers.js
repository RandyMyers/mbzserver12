const Trash = require("../models/trash");
const Inbox = require("../models/inbox");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// Move email to trash
exports.moveToTrash = async (req, res) => {
  try {
    const { emailId, originalFolder } = req.body;
    let email;

    // Find the email in its original folder
    if (originalFolder === 'inbox') {
      email = await Inbox.findById(emailId);
    } else {
      email = await Email.findById(emailId);
    }

    if (!email) {
      return res.status(404).json({ success: false, message: "Email not found" });
    }

    // Create trash entry
    const trashEmail = new Trash({
      sender: email.sender,
      subject: email.subject,
      body: email.body,
      replyTo: email.replyTo,
      status: email.status,
      receivedAt: email.receivedAt,
      emailLogs: email.emailLogs,
      organization: email.organization,
      user: email.user,
      originalFolder: originalFolder
    });

    await trashEmail.save();

    // Delete from original folder
    if (originalFolder === 'inbox') {
      await Inbox.findByIdAndDelete(emailId);
    } else {
      await Email.findByIdAndDelete(emailId);
    }

    await logEvent({
      action: 'move_to_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: emailId,
      details: { subject: email.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email moved to trash" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to move email to trash" });
  }
};

// Get all trash emails
exports.getTrashEmails = async (req, res) => {
  try {
    const trashEmails = await Trash.find({ organization: req.user.organization })
      .populate("user organization", "name email")
      .sort({ deletedAt: -1 })
      .exec();
    res.status(200).json({ success: true, trashEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve trash emails" });
  }
};

// Restore email from trash
exports.restoreFromTrash = async (req, res) => {
  try {
    const { trashId } = req.params;
    const trashEmail = await Trash.findById(trashId);

    if (!trashEmail) {
      return res.status(404).json({ success: false, message: "Trash email not found" });
    }

    // Restore to original folder
    if (trashEmail.originalFolder === 'inbox') {
      const inboxEmail = new Inbox({
        sender: trashEmail.sender,
        subject: trashEmail.subject,
        body: trashEmail.body,
        replyTo: trashEmail.replyTo,
        status: trashEmail.status,
        receivedAt: trashEmail.receivedAt,
        emailLogs: trashEmail.emailLogs,
        organization: trashEmail.organization,
        user: trashEmail.user
      });
      await inboxEmail.save();
    } else {
      const email = new Email({
        sender: trashEmail.sender,
        subject: trashEmail.subject,
        body: trashEmail.body,
        replyTo: trashEmail.replyTo,
        status: trashEmail.status,
        receivedAt: trashEmail.receivedAt,
        emailLogs: trashEmail.emailLogs,
        organization: trashEmail.organization,
        user: trashEmail.user
      });
      await email.save();
    }

    // Delete from trash
    await Trash.findByIdAndDelete(trashId);

    await logEvent({
      action: 'restore_from_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: trashId,
      details: { subject: trashEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email restored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to restore email" });
  }
};

// Permanently delete from trash
exports.deleteFromTrash = async (req, res) => {
  try {
    const { trashId } = req.params;
    const trashEmail = await Trash.findById(trashId);

    if (!trashEmail) {
      return res.status(404).json({ success: false, message: "Trash email not found" });
    }

    await Trash.findByIdAndDelete(trashId);

    await logEvent({
      action: 'delete_from_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: trashId,
      details: { subject: trashEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email permanently deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email" });
  }
}; 