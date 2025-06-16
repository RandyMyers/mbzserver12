const Template = require('../models/template');
const cloudinary = require('cloudinary').v2;

// Helper function to handle errors
const handleError = (res, error, status = 400) => {
    console.error(error);
    res.status(status).json({ 
      success: false, 
      message: error.message || 'An error occurred' 
    });
  };

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, category, isPremium, price, features } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description and category are required'
      });
    }

    const templateData = {
      userId,
      name,
      description,
      category,
      isPremium: isPremium || false,
      price: isPremium ? (price || 0) : 0,
      features: features || []
    };

    // Handle image upload
    if (req.files?.image) {
      const imageFile = req.files.image;
      try {
        const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
          folder: "template_images",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" }
          ]
        });

        templateData.image = {
          url: result.secure_url,
          publicId: result.public_id
        };
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload template image"
        });
      }
    }

    const newTemplate = new Template(templateData);
    await newTemplate.save();

    res.status(201).json({
      success: true,
      data: newTemplate,
      message: 'Template created successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const { category, isPremium } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';

    const templates = await Template.find(filter)
      .populate('userId', 'name email') // Populate creator info
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id).populate('userId', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, isPremium, price, features } = req.body;
    const userId = req.user._id;

    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or unauthorized access'
      });
    }

    // Update fields
    if (name) template.name = name;
    if (description) template.description = description;
    if (category) template.category = category;
    if (isPremium !== undefined) template.isPremium = isPremium;
    if (price !== undefined) template.price = price;
    if (features) template.features = features;

    // Handle image update
    if (req.files?.image) {
      const imageFile = req.files.image;
      try {
        // Delete old image if exists
        if (template.image?.publicId) {
          await cloudinary.uploader.destroy(template.image.publicId);
        }

        const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
          folder: "template_images",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" }
          ]
        });

        template.image = {
          url: result.secure_url,
          publicId: result.public_id
        };
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to update template image"
        });
      }
    }

    await template.save();

    res.status(200).json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const template = await Template.findOneAndDelete({ _id: id, userId });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or unauthorized access'
      });
    }

    // Clean up image from Cloudinary
    if (template.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(template.image.publicId);
      } catch (cloudinaryError) {
        console.error('Failed to delete template image:', cloudinaryError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Get templates by user
exports.getUserTemplates = async (req, res) => {
  try {
    const { userId } = req.params;
    const templates = await Template.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    handleError(res, error);
  }
};

// Get template analytics
exports.getTemplateAnalytics = async (req, res) => {
  try {
    // Only admin/super-admin should access this
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Total templates count
    const totalTemplates = await Template.countDocuments();

    // Templates by category
    const templatesByCategory = await Template.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Premium vs free templates
    const templatesByType = await Template.aggregate([
      { $group: { _id: "$isPremium", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTemplates,
        templatesByCategory,
        templatesByType
      }
    });

  } catch (error) {
    handleError(res, error);
  }
};