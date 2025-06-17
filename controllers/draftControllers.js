const Draft = require("../models/draft");
const Email = require("../models/emails");
const logEvent = require('../helper/logEvent');

// Create a new draft
exports.createDraft = async (req, res) => {
  try {
    const {
      sender,
      subject,
      body,
      recipients,
      cc,
      bcc,
      attachments,
      organization,
      user
    } = req.body;

    const draft = new Draft({
      sender,
      subject,
      body,
      recipients,
      cc,
      bcc,
      attachments,
      organization,
      user
    });

    const savedDraft = await draft.save();

    await logEvent({
      action: 'create_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: savedDraft._id,
      details: { subject: savedDraft.subject },
      organization: req.user.organization
    });

    res.status(201).json({ success: true, draft: savedDraft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create draft" });
  }
};

// Get all drafts
exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Draft.find({ organization: req.user.organization })
      .populate("user organization", "name email")
      .sort({ lastSavedAt: -1 })
      .exec();
    res.status(200).json({ success: true, drafts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve drafts" });
  }
};

// Get a single draft
exports.getDraftById = async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.draftId)
      .populate("user organization", "name email")
      .exec();

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    res.status(200).json({ success: true, draft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve draft" });
  }
};

// Update a draft
exports.updateDraft = async (req, res) => {
  try {
    const {
      sender,
      subject,
      body,
      recipients,
      cc,
      bcc,
      attachments
    } = req.body;

    const draft = await Draft.findById(req.params.draftId);

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    draft.sender = sender || draft.sender;
    draft.subject = subject || draft.subject;
    draft.body = body || draft.body;
    draft.recipients = recipients || draft.recipients;
    draft.cc = cc || draft.cc;
    draft.bcc = bcc || draft.bcc;
    draft.attachments = attachments || draft.attachments;
    draft.lastSavedAt = Date.now();

    const updatedDraft = await draft.save();

    await logEvent({
      action: 'update_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: updatedDraft._id,
      details: { subject: updatedDraft.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, draft: updatedDraft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update draft" });
  }
};

// Delete a draft
exports.deleteDraft = async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.draftId);

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    await Draft.findByIdAndDelete(req.params.draftId);

    await logEvent({
      action: 'delete_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: draft._id,
      details: { subject: draft.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Draft deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete draft" });
  }
};

// Send draft as email
exports.sendDraft = async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.draftId);

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    // Create new email from draft
    const email = new Email({
      sender: draft.sender,
      subject: draft.subject,
      body: draft.body,
      recipients: draft.recipients,
      cc: draft.cc,
      bcc: draft.bcc,
      attachments: draft.attachments,
      organization: draft.organization,
      user: draft.user,
      status: 'sent'
    });

    await email.save();

    // Delete the draft
    await Draft.findByIdAndDelete(req.params.draftId);

    await logEvent({
      action: 'send_draft',
      user: req.user._id,
      resource: 'Draft',
      resourceId: draft._id,
      details: { subject: draft.subject },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, message: "Draft sent successfully", email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send draft" });
  }
}; 