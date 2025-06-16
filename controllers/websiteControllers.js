// controllers/websiteController.js
const Website = require('../models/website');
const Template = require('../models/template');
const User = require('../models/users');
const Organization = require('../models/organization');
const cloudinary = require('cloudinary').v2;


// Helper function to handle errors
const handleError = (res, error, status = 400) => {
  console.log(error);
  console.error(error);
  res.status(status).json({ 
    success: false, 
    message: error.message || 'An error occurred' 
  });
};

// Verify organization access middleware
const verifyOrganizationAccess = async (organizationId, userId) => {
  return await Organization.findOne({
    _id: organizationId,
    $or: [
      { owner: userId },
      { admins: userId },
      { members: userId }
    ]
  });
};

// Domain validation helper
const validateDomain = (domain) => {
  const domainRegex = /^[a-z0-9-]+$/;
  return domainRegex.test(domain);
};


// Create a new website (Step 1)
exports.createWebsite = async (req, res) => {
  try {
    const { 
      organizationId, 
      userId,
      businessName, 
      businessType, 
      domain, 
      description, 
      templateId,
      needLogoDesign,
      logoDesignNotes,
      logoDesignPreferences
    } = req.body;
    
    console.log(req.body);
    

    

    // Verify organization access
    const organization = await verifyOrganizationAccess(organizationId);
    if (!organization) {
      return res.status(403).json({
        success: false,
        message: 'Organization not found or unauthorized access'
      });
    }

    // Validate domain
    if (!validateDomain(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Domain can only contain letters, numbers, and hyphens'
      });
    }

    const domainExists = await Website.findOne({ domain });
    if (domainExists) {
      return res.status(400).json({
        success: false,
        message: 'Domain already taken'
      });
    }

  

    // Create website data with logo preferences
    const websiteData = {
      organization: organizationId,
      businessName,
      businessType,
      domain,
      description,
      template: templateId,
      owner: userId,
      status: 'draft',
      // Set default colors
      primaryColor: '#800020',
      secondaryColor: '#0A2472',
      complementaryColor: '#e18d01',
      needLogoDesign: needLogoDesign || false,
      logoDesignNotes: logoDesignNotes || '',
      logoDesignPreferences: logoDesignPreferences || {
        style: 'Modern',
        colorScheme: [],
        includeIcon: false,
        includeText: true,
        inspirationLinks: []
      }
    };

    // Handle logo upload (only if not requesting logo design)
    if (!websiteData.needLogoDesign && req.files?.logo) {
      const logoFile = req.files.logo;
      try {
        const result = await cloudinary.uploader.upload(logoFile.tempFilePath, {
          folder: "website_logos",
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" }
          ]
        });

        websiteData.logo = {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: logoFile.name
        };
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload logo"
        });
      }
    }

    // Create and save website
    const newWebsite = new Website(websiteData);
    await newWebsite.save();



    res.status(201).json({
      success: true,
      data: newWebsite,
      message: 'Website created successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Get all websites (super admin only)
exports.getAllWebsites = async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user is super admin
      const user = await User.findById(userId);
      if (!user || user.role !== 'super-admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only super admins can access all websites'
        });
      }
  
      const websites = await Website.find()
        .populate('template')
        .populate('organization')
        .populate('owner')
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        success: true,
        count: websites.length,
        data: websites
      });
  
    } catch (error) {
      handleError(res, error);
    }
  };

  // Get website analytics
exports.getWebsiteAnalytics = async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user is super admin
      const user = await User.findById(userId);
      if (!user || user.role !== 'super-admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only super admins can access analytics'
        });
      }
  
      // Total websites count
      const totalWebsites = await Website.countDocuments();
  
      // Websites by status
      const websitesByStatus = await Website.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
  
      // Websites by organization
      const websitesByOrganization = await Website.aggregate([
        { $group: { _id: "$organization", count: { $sum: 1 } } },
        { $lookup: {
            from: "organizations",
            localField: "_id",
            foreignField: "_id",
            as: "organization"
          }
        },
        { $unwind: "$organization" },
        { $project: {
            "organization.name": 1,
            "organization._id": 1,
            count: 1
          }
        }
      ]);
  
      // Websites created over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const websitesOverTime = await Website.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
      res.status(200).json({
        success: true,
        data: {
          totalWebsites,
          websitesByStatus,
          websitesByOrganization,
          websitesOverTime
        }
      });
  
    } catch (error) {
      handleError(res, error);
    }
  };

  // Get organization website analytics
exports.getOrganizationWebsiteAnalytics = async (req, res) => {
    try {
      const { organizationId } = req.params;
      const owner = req.user._id;
  
      // Verify organization access
      const hasAccess = await verifyOrganizationAccess(organizationId, owner);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
  
      // Total websites for organization
      const totalWebsites = await Website.countDocuments({ organization: organizationId });
  
      // Websites by status for organization
      const websitesByStatus = await Website.aggregate([
        { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
  
      // Websites created over time for organization (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const websitesOverTime = await Website.aggregate([
        { 
          $match: { 
            organization: mongoose.Types.ObjectId(organizationId),
            createdAt: { $gte: thirtyDaysAgo } 
          } 
        },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
      res.status(200).json({
        success: true,
        data: {
          totalWebsites,
          websitesByStatus,
          websitesOverTime
        }
      });
  
    } catch (error) {
      handleError(res, error);
    }
  };

// Update basic info (Step 1)
exports.updateBasicInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      businessName, 
      businessType, 
      domain, 
      description,
      needLogoDesign,
      logoDesignNotes,
      logoDesignPreferences
    } = req.body;
    
    const owner = req.user._id;

    const website = await Website.findOne({ _id: id, owner });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(website.organization, owner);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Update fields
    if (businessName) website.businessName = businessName;
    if (businessType) website.businessType = businessType;
    if (description) website.description = description;
    
    // Logo design fields
    if (typeof needLogoDesign !== 'undefined') {
      website.needLogoDesign = needLogoDesign;
      // If switching to logo design, remove existing logo
      if (needLogoDesign && website.logo?.publicId) {
        await cloudinary.uploader.destroy(website.logo.publicId);
        website.logo = undefined;
      }
    }
    
    if (logoDesignNotes) website.logoDesignNotes = logoDesignNotes;
    if (logoDesignPreferences) {
      website.logoDesignPreferences = {
        ...website.logoDesignPreferences,
        ...logoDesignPreferences
      };
    }

    // Handle domain change
    if (domain && domain !== website.domain) {
      if (!validateDomain(domain)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid domain format'
        });
      }

      const domainExists = await Website.findOne({ domain, _id: { $ne: id } });
      if (domainExists) {
        return res.status(400).json({
          success: false,
          message: 'Domain already taken'
        });
      }
      website.domain = domain;
    }

    // Handle logo upload (only if not requesting logo design)
    if (!website.needLogoDesign && req.files?.logo) {
      const logoFile = req.files.logo;
      try {
        // Delete old logo if exists
        if (website.logo?.publicId) {
          await cloudinary.uploader.destroy(website.logo.publicId);
        }

        const result = await cloudinary.uploader.upload(logoFile.tempFilePath, {
          folder: "website_logos",
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" }
          ]
        });

        website.logo = {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: logoFile.name
        };
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to update logo"
        });
      }
    }

    website.lastUpdated = Date.now();
    await website.save();

    res.status(200).json({
      success: true,
      data: website,
      message: 'Basic info updated successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};
// Update business info (Step 2)
exports.updateBusinessInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      businessAddress,
      businessContactInfo,
      supportEmail,
      termsConditions,
      privacyPolicy
    } = req.body;
    const owner = req.user._id;

    const website = await Website.findOne({ _id: id, owner });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(website.organization, owner);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Update fields
    if (businessAddress) website.businessAddress = businessAddress;
    if (businessContactInfo) website.businessContactInfo = businessContactInfo;
    if (supportEmail) website.supportEmail = supportEmail;
    if (termsConditions) website.termsConditions = termsConditions;
    if (privacyPolicy) website.privacyPolicy = privacyPolicy;

    website.lastUpdated = Date.now();
    await website.save();

    res.status(200).json({
      success: true,
      data: website,
      message: 'Business info updated successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Update colors (Step 3)
exports.updateColors = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      primaryColor,
      secondaryColor,
      complementaryColor
    } = req.body;
    const owner = req.user._id;

    const website = await Website.findOne({ _id: id, owner });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(website.organization, owner);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate colors
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (primaryColor && !colorRegex.test(primaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid primary color format'
      });
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid secondary color format'
      });
    }
    if (complementaryColor && !colorRegex.test(complementaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complementary color format'
      });
    }

    // Update colors
    if (primaryColor) website.primaryColor = primaryColor;
    if (secondaryColor) website.secondaryColor = secondaryColor;
    if (complementaryColor) website.complementaryColor = complementaryColor;

    website.lastUpdated = Date.now();
    await website.save();

    res.status(200).json({
      success: true,
      data: website,
      message: 'Colors updated successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Update emails (Step 4)
exports.updateEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const { customEmails } = req.body;
    const owner = req.user._id;

    const website = await Website.findOne({ _id: id, owner });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(website.organization, owner);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate emails
    const emailRegex = /^[a-z0-9._-]+$/;
    for (const email of customEmails) {
      if (!emailRegex.test(email.email)) {
        return res.status(400).json({
          success: false,
          message: `Invalid email name: ${email.email}`
        });
      }
      if (!email.purpose || email.purpose.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Email purpose is required and must be under 100 characters'
        });
      }
    }

    // Update emails
    website.customEmails = customEmails;
    website.lastUpdated = Date.now();
    await website.save();

    res.status(200).json({
      success: true,
      data: website,
      message: 'Emails updated successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};


// Get all websites for organization
exports.getOrganizationWebsites = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const websites = await Website.find({ organization: organizationId })
      .populate('template')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: websites.length,
      data: websites
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Delete website
exports.deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user._id;

    const website = await Website.findOneAndDelete({ _id: id, owner });
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Clean up logo from Cloudinary
    if (website.logo?.publicId) {
      try {
        await cloudinary.uploader.destroy(website.logo.publicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete logo:', cloudinaryError);
      }
    }

    // Remove from organization
    await Organization.updateOne(
      { _id: website.organization },
      { $pull: { websites: website._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Website deleted successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Check domain availability
exports.checkDomain = async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain parameter is required'
      });
    }

    if (!validateDomain(domain)) {
      return res.status(400).json({
        success: false,
        message: 'Domain can only contain letters, numbers, and hyphens'
      });
    }

    const exists = await Website.findOne({ domain });
    
    res.status(200).json({
      success: true,
      available: !exists,
      message: exists ? 'Domain is already taken' : 'Domain is available'
    });
  } catch (error) {
    handleError(res, error);
  }
};