const mongoose = require('mongoose');

const chatIntegrationSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  scriptId: { type: String },
  propertyUrl: { type: String },
  ticketEmail: { type: String },
  jsApiKey: { type: String },
  widgetId: { type: String },
  directChatLink: { type: String },
  isActive: { type: Boolean, default: true },
  status: { type: String, default: 'connected' },
  showOnCustomerDashboard: { type: Boolean, default: true },
  showOnAdminDashboard: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ChatIntegration', chatIntegrationSchema); 