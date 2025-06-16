const AuditLog = require('../models/auditLog');

// Create a new audit log entry
exports.createLog = async (req, res) => {
  try {
    const { action, user, resource, resourceId, details, organization } = req.body;
    const log = new AuditLog({ action, user, resource, resourceId, details, organization });
    await log.save();
    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create audit log' });
  }
};

// Get audit logs (with optional filters)
exports.getLogs = async (req, res) => {
  try {
    const { user, resource, organization, startDate, endDate } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (resource) filter.resource = resource;
    if (organization) filter.organization = organization;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    const logs = await AuditLog.find(filter).populate('user organization');
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// Get a single audit log by ID
exports.getLogById = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findById(logId).populate('user organization');
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
};

// Delete an audit log
exports.deleteLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AuditLog.findByIdAndDelete(logId);
    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found' });
    res.status(200).json({ success: true, message: 'Audit log deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete audit log' });
  }
}; 