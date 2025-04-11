const EmailTemplate = require("../models/emailTemplate"); // Import the EmailTemplate model

// CREATE a new email template
exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body, variables, createdBy, organization } = req.body;
    console.log(req.body);

    const emailTemplateData = {
      name,
      subject,
      body,
      variables,
      createdBy,
    };

    // Only add the organization field if it's provided
    if (organization) {
      emailTemplateData.organization = organization;
    }

    const newEmailTemplate = new EmailTemplate(emailTemplateData);

    const savedEmailTemplate = await newEmailTemplate.save();
    res.status(201).json({ success: true, emailTemplate: savedEmailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create email template" });
  }
};


// GET all email templates
exports.getAllEmailTemplates = async (req, res) => {
  try {
    const emailTemplates = await EmailTemplate.find()
      .populate("createdBy organization", "name") // Populate fields with related data
      .exec();
    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates" });
  }
};

// GET email templates by organization
exports.getEmailTemplatesByOrganization = async (req, res) => {
  const { organizationId } = req.params; // Assuming organizationId is passed in the URL

  try {
    const emailTemplates = await EmailTemplate.find({ organization: organizationId })
      .populate("createdBy", "name") // Populate the createdBy field with the user's name
      .exec();

    if (!emailTemplates.length) {
      return res.status(404).json({ success: false, message: "No email templates found for this organization" });
    }

    res.status(200).json({ success: true, emailTemplates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email templates by organization" });
  }
};

// GET a single email template by ID
exports.getEmailTemplateById = async (req, res) => {
  const { emailTemplateId } = req.params;
  try {
    const emailTemplate = await EmailTemplate.findById(emailTemplateId)
      .populate("createdBy organization", "name")
      .exec();
    if (!emailTemplate) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }
    res.status(200).json({ success: true, emailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve email template" });
  }
};

// UPDATE an existing email template
exports.updateEmailTemplate = async (req, res) => {
  const { emailTemplateId } = req.params;
  const { name, subject, body, variables, isActive } = req.body;

  try {
    const updatedEmailTemplate = await EmailTemplate.findByIdAndUpdate(
      emailTemplateId,
      { name, subject, body, variables, isActive, updatedAt: Date.now() },
      { new: true } // return the updated email template
    );

    if (!updatedEmailTemplate) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }

    res.status(200).json({ success: true, emailTemplate: updatedEmailTemplate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update email template" });
  }
};

// DELETE an email template
exports.deleteEmailTemplate = async (req, res) => {
  const { emailTemplateId } = req.params;
  try {
    const deletedEmailTemplate = await EmailTemplate.findByIdAndDelete(emailTemplateId);
    if (!deletedEmailTemplate) {
      return res.status(404).json({ success: false, message: "Email template not found" });
    }
    res.status(200).json({ success: true, message: "Email template deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete email template" });
  }
};
