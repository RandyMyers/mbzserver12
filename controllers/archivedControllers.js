const Archived = require("../models/archived");
const Inbox = require("../models/inbox");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// Move email to archive
exports.moveToArchive = async (req, res) => {
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

    // Create archived entry
    const archivedEmail = new Archived({
      sender: email.sender,
      subject: email.subject,
      body: email.body,
      replyTo: email.replyTo,
      status: 'archived',
      emailLogs: email.emailLogs,
      organization: email.organization,
      user: email.user,
      originalFolder: originalFolder,
      attachments: email.attachments,
      recipients: email.recipients,
      cc: email.cc,
      bcc: email.bcc
    });

    await archivedEmail.save();

    // Delete from original folder
    if (originalFolder === 'inbox') {
      await Inbox.findByIdAndDelete(emailId);
    } else {
      await Email.findByIdAndDelete(emailId);
    }

    await logEvent({
      action: 'move_to_archive',
      user: req.user._id,
      resource: 'Email',
      resourceId: emailId,
      details: { subject: email.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email moved to archive" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to move email to archive" });
  }
};

// Get all archived emails
exports.getArchivedEmails = async (req, res) => {
  try {
    const archivedEmails = await Archived.find({ organization: req.user.organization })
      .populate("user organization", "name email")
      .sort({ archivedAt: -1 })
      .exec();
    res.status(200).json({ success: true, archivedEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve archived emails" });
  }
};

// Restore email from archive
exports.restoreFromArchive = async (req, res) => {
  try {
    const { archivedId } = req.params;
    const archivedEmail = await Archived.findById(archivedId);

    if (!archivedEmail) {
      return res.status(404).json({ success: false, message: "Archived email not found" });
    }

    // Restore to original folder
    if (archivedEmail.originalFolder === 'inbox') {
      const inboxEmail = new Inbox({
        sender: archivedEmail.sender,
        subject: archivedEmail.subject,
        body: archivedEmail.body,
        replyTo: archivedEmail.replyTo,
        status: 'unread',
        emailLogs: archivedEmail.emailLogs,
        organization: archivedEmail.organization,
        user: archivedEmail.user,
        attachments: archivedEmail.attachments,
        recipients: archivedEmail.recipients,
        cc: archivedEmail.cc,
        bcc: archivedEmail.bcc
      });
      await inboxEmail.save();
    } else {
      const email = new Email({
        sender: archivedEmail.sender,
        subject: archivedEmail.subject,
        body: archivedEmail.body,
        replyTo: archivedEmail.replyTo,
        status: archivedEmail.originalFolder,
        emailLogs: archivedEmail.emailLogs,
        organization: archivedEmail.organization,
        user: archivedEmail.user,
        attachments: archivedEmail.attachments,
        recipients: archivedEmail.recipients,
        cc: archivedEmail.cc,
        bcc: archivedEmail.bcc
      });
      await email.save();
    }

    // Delete from archive
    await Archived.findByIdAndDelete(archivedId);

    await logEvent({
      action: 'restore_from_archive',
      user: req.user._id,
      resource: 'Email',
      resourceId: archivedId,
      details: { subject: archivedEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email restored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to restore email" });
  }
};

// Move archived email to trash
exports.moveToTrash = async (req, res) => {
  try {
    const { archivedId } = req.params;
    const archivedEmail = await Archived.findById(archivedId);

    if (!archivedEmail) {
      return res.status(404).json({ success: false, message: "Archived email not found" });
    }

    // Create trash entry
    const trashEmail = new Trash({
      sender: archivedEmail.sender,
      subject: archivedEmail.subject,
      body: archivedEmail.body,
      replyTo: archivedEmail.replyTo,
      status: 'unread',
      emailLogs: archivedEmail.emailLogs,
      organization: archivedEmail.organization,
      user: archivedEmail.user,
      originalFolder: 'archived',
      attachments: archivedEmail.attachments,
      recipients: archivedEmail.recipients,
      cc: archivedEmail.cc,
      bcc: archivedEmail.bcc
    });

    await trashEmail.save();

    // Delete from archive
    await Archived.findByIdAndDelete(archivedId);

    await logEvent({
      action: 'move_archived_to_trash',
      user: req.user._id,
      resource: 'Email',
      resourceId: archivedId,
      details: { subject: archivedEmail.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Email moved to trash" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to move email to trash" });
  }
}; 