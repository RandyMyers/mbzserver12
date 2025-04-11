const Organization = require("../models/organization"); // Import the Organization model
const cloudinary = require('cloudinary').v2;

// CREATE a new organization
exports.createOrganization = async (req, res) => {
  try {
    const { name, description, address, phone, email, businessType } = req.body;

    const newOrganization = new Organization({
      name,
      description,
      address,
      phone,
      email,
      businessType,
    });

    const savedOrganization = await newOrganization.save();
    res.status(201).json({ success: true, organization: savedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create organization" });
  }
};

// GET all organizations
exports.getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.status(200).json({ success: true, organizations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve organizations" });
  }
};

// GET an organization by its ID
exports.getOrganizationById = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    res.status(200).json({ success: true, organization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve organization" });
  }
};

// UPDATE organization details
exports.updateOrganization = async (req, res) => {
  const { organizationId } = req.params;
  const updateData = req.body;

  try {
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: updateData, updatedAt: Date.now() },
      { new: true } // return the updated organization
    );

    if (!updatedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.status(200).json({ success: true, organization: updatedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update organization" });
  }
};

// DELETE an organization
exports.deleteOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const deletedOrganization = await Organization.findByIdAndDelete(organizationId);
    if (!deletedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }
    res.status(200).json({ success: true, message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete organization" });
  }
};

// UPDATE organization logo
exports.updateOrganizationLogo = async (req, res) => {
  const { organizationId } = req.params;

  if (!req.files || !req.files.logo) {
    return res.status(400).json({ success: false, message: "No logo file uploaded" });
  }

  const logoFile = req.files.logo;

  try {
    // Upload the logo file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(logoFile.tempFilePath, {
      folder: "organization_logos", // Specify a folder in your Cloudinary account
    });

    // Update the organization's logo URL
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { logoUrl: uploadResult.secure_url, updatedAt: Date.now() },
      { new: true } // return the updated organization
    );

    if (!updatedOrganization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.status(200).json({ success: true, organization: updatedOrganization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update organization logo" });
  }
};