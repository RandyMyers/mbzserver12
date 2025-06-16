const Sender = require("../models/sender"); // Import the Sender model
const Organization = require("../models/organization"); // If needed to check organization
const User = require("../models/users"); // If needed to check user

// CREATE a new sender
exports.createSender = async (req, res) => {
  try {
    const { organizationId, userId, name, email, smtpHost, smtpPort, username, password, maxDailyLimit } = req.body;
    console.log(req.body);

    const newSender = new Sender({
      organization: organizationId,
      userId,
      name,
      email,
      smtpHost,
      smtpPort,
      username,
      password,
      maxDailyLimit,
    });

    const savedSender = await newSender.save();
    res.status(201).json({ success: true, sender: savedSender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create sender" });
  }
};

// GET all senders for a user
exports.getSendersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const senders = await Sender.find({ userId })
      .populate('organization userId')
      .exec();
    res.status(200).json({ success: true, senders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve senders" });
  }
};

// GET a sender by ID
exports.getSenderById = async (req, res) => {
  const { senderId } = req.params;
  try {
    const sender = await Sender.findById(senderId)
      .populate('organization user')
      .exec();
    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }
    res.status(200).json({ success: true, sender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve sender" });
  }
};

// GET all senders for a specific organization
exports.getSendersByOrganization = async (req, res) => {
    const { organizationId } = req.params;
    try {
      const senders = await Sender.find({ organization: organizationId })
        .populate('organization user')
        .exec();
      res.status(200).json({ success: true, senders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to retrieve senders" });
    }
  };

// UPDATE a sender's details
exports.updateSender = async (req, res) => {
  const { senderId } = req.params;
  const { name, email, smtpHost, smtpPort, username, password, maxDailyLimit, isActive, organizationId, userId } = req.body;
  console.log(req.body);

  try {
    const updateFields = { name, email, smtpHost, smtpPort, username, password, maxDailyLimit, isActive, updatedAt: Date.now() };
    if (organizationId) updateFields.organization = organizationId;
    if (userId) updateFields.userId = userId;
    const updatedSender = await Sender.findByIdAndUpdate(
      senderId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    res.status(200).json({ success: true, sender: updatedSender });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update sender" });
  }
};

// DELETE a sender
exports.deleteSender = async (req, res) => {
  const { senderId } = req.params;

  try {
    const deletedSender = await Sender.findByIdAndDelete(senderId);

    if (!deletedSender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    res.status(200).json({ success: true, message: "Sender deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete sender" });
  }
};

// RESET the daily limit of emails sent
exports.resetDailyLimit = async (req, res) => {
  const { senderId } = req.params;

  try {
    const sender = await Sender.findById(senderId);

    if (!sender) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    await sender.resetDailyLimit();
    res.status(200).json({ success: true, message: "Daily email limit reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to reset daily email limit" });
  }
};
