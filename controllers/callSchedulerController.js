const CallScheduler = require('../models/callScheduler');

// Create a new call
exports.createCall = async (req, res) => {
  try {
    const { organizationId, userId, ...callData } = req.body;
    console.log(req.body);
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, error: 'organizationId and userId are required' });
    }
    const call = new CallScheduler({ ...callData, organizationId, userId });
    await call.save();
    res.status(201).json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all calls for an organization (and optionally user)
exports.getCalls = async (req, res) => {
  try {
    const { organizationId, userId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const filter = { organizationId };
    if (userId) filter.userId = userId;
    const calls = await CallScheduler.find(filter).sort({ startTime: 1 });
    res.json({ success: true, data: calls });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a single call by ID (must belong to org)
exports.getCallById = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOne({ _id: req.params.id, organizationId });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a call (must belong to org)
exports.updateCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      req.body,
      { new: true }
    );
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Cancel a call (must belong to org)
exports.cancelCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, data: call });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a call (must belong to org)
exports.deleteCall = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const call = await CallScheduler.findOneAndDelete({ _id: req.params.id, organizationId });
    if (!call) return res.status(404).json({ success: false, error: 'Call not found or not authorized' });
    res.json({ success: true, message: 'Call deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 