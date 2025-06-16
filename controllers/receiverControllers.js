const Receiver = require("../models/receiver"); // Adjust the path as necessary

// CREATE a new Receiver
exports.createReceiver = async (req, res) => {
  try {
    const {
      organizationId,
      userId,
      name,
      email,
      imapHost,
      imapPort,
      username,
      password,
      useTLS,
      maxEmailsPerFetch,
    } = req.body;

    console.log(req.body)

    const newReceiver = new Receiver({
      organization: organizationId,
      userId,
      name,
      email,
      imapHost,
      imapPort,
      username,
      password,
      useTLS,
      maxEmailsPerFetch,
    });

    const savedReceiver = await newReceiver.save();
    res.status(201).json({ success: true, receiver: savedReceiver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create receiver" });
  }
};

// GET all Receivers for a specific User
exports.getReceiversByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const receivers = await Receiver.find({ userId })
      .populate("organization", "name") // Populate organization details
      .exec();
    res.status(200).json({ success: true, receivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve receivers" });
  }
};

// GET a specific Receiver by ID
exports.getReceiverById = async (req, res) => {
  const { receiverId } = req.params;
  try {
    const receiver = await Receiver.findById(receiverId).populate("organization", "name").exec();
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }
    res.status(200).json({ success: true, receiver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve receiver" });
  }
};

// UPDATE a Receiver by ID
exports.updateReceiver = async (req, res) => {
  const { receiverId } = req.params;
  const updates = { ...req.body };
  if (req.body.organizationId) updates.organization = req.body.organizationId;
  if (req.body.userId) updates.userId = req.body.userId;

  try {
    const updatedReceiver = await Receiver.findByIdAndUpdate(receiverId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the updates conform to the schema
    });

    if (!updatedReceiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    res.status(200).json({ success: true, receiver: updatedReceiver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update receiver" });
  }
};

// DELETE a Receiver by ID
exports.deleteReceiver = async (req, res) => {
  const { receiverId } = req.params;

  try {
    const deletedReceiver = await Receiver.findByIdAndDelete(receiverId);
    if (!deletedReceiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }
    res.status(200).json({ success: true, message: "Receiver deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete receiver" });
  }
};

// DEACTIVATE a Receiver by ID
exports.deactivateReceiver = async (req, res) => {
  const { receiverId } = req.params;

  try {
    const receiver = await Receiver.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }

    await receiver.deactivate();
    res.status(200).json({ success: true, message: "Receiver deactivated successfully", receiver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to deactivate receiver" });
  }
};
