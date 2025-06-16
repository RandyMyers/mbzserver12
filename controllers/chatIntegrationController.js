const ChatIntegration = require('../models/chatIntegration');

exports.createChatIntegration = async (req, res) => {
  try {
    const chatIntegration = new ChatIntegration(req.body);
    await chatIntegration.save();
    res.status(201).json(chatIntegration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllChatIntegrations = async (req, res) => {
  try {
    const integrations = await ChatIntegration.find();
    console.log(integrations);
    res.json(integrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getChatIntegrationById = async (req, res) => {
  if (req.params.id === 'all') {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  try {
    const integration = await ChatIntegration.findById(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json(integration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateChatIntegration = async (req, res) => {
  try {
    const integration = await ChatIntegration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json(integration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteChatIntegration = async (req, res) => {
  try {
    const integration = await ChatIntegration.findByIdAndDelete(req.params.id);
    if (!integration) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 