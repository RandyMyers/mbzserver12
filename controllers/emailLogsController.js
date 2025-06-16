const EmailLogs = require('../models/emailLogs');

// 1. Delivery/Failure Rate
exports.getDeliveryStats = async (req, res) => {
  try {
    // Optionally filter by org, campaign, date range
    const match = {};
    if (req.query.campaignId) match.campaign = req.query.campaignId;
    if (req.query.startDate && req.query.endDate) {
      match.createdAt = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }
    const result = await EmailLogs.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Device/Client Usage
exports.getDeviceStats = async (req, res) => {
  try {
    const match = {};
    if (req.query.campaignId) match.campaign = req.query.campaignId;
    if (req.query.startDate && req.query.endDate) {
      match.createdAt = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }
    const result = await EmailLogs.aggregate([
      { $match: match },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Geographic Distribution
exports.getGeoStats = async (req, res) => {
  try {
    const match = {};
    if (req.query.campaignId) match.campaign = req.query.campaignId;
    if (req.query.startDate && req.query.endDate) {
      match.createdAt = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }
    const result = await EmailLogs.aggregate([
      { $match: match },
      { $group: { _id: '$country', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 