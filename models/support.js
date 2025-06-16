const mongoose = require('mongoose');

const chatIntegrationSchema = new mongoose.Schema({
  provider: { type: String, required: true }, // e.g. 'tawk', 'tidio', etc.
  name: { type: String, required: true },
  apiKey: { type: String },
  propertyId: { type: String },
  widgetId: { type: String },
  config: { type: mongoose.Schema.Types.Mixed }, // for any extra config
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'support'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['technical', 'billing', 'account', 'general'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String }
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  messages: [messageSchema],
  hasUnreadMessages: { type: Boolean, default: false },
  chatIntegrations: [chatIntegrationSchema] // new field for chat integrations
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema); 