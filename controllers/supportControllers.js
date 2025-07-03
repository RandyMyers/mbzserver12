const SupportTicket = require('../models/support');
const logEvent = require('../helper/logEvent');
const mongoose = require('mongoose');

// Create a new support ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, customer, organizationId } = req.body;
    if (!subject || !description || !customer || !organizationId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = new SupportTicket({
      subject,
      description,
      category,
      priority,
      customer,
      organizationId,
      messages: [],
      hasUnreadMessages: false
    });
    await ticket.save();
    await logEvent({
      action: 'create_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { subject: ticket.subject, status: ticket.status },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all tickets for an organization
exports.getTickets = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const tickets = await SupportTicket.find({ organizationId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a ticket (subject, description, category, priority)
exports.updateTicket = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      req.body,
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    await logEvent({
      action: 'update_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { before: oldTicket, after: ticket },
      organization: req.user.organization
    });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Add a message to a ticket
exports.addMessageToTicket = async (req, res) => {
  try {
    const { organizationId, sender, content } = req.body;
    if (!organizationId || !sender || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    ticket.messages.push({ sender, content, readStatus: sender === 'support' ? false : true });
    ticket.hasUnreadMessages = sender === 'customer';
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Change ticket status
exports.changeTicketStatus = async (req, res) => {
  try {
    const { organizationId, status } = req.body;
    if (!organizationId || !status) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    await logEvent({
      action: 'close_support_ticket',
      user: req.user._id,
      resource: 'SupportTicket',
      resourceId: ticket._id,
      details: { subject: ticket.subject, closeDate: new Date() },
      organization: req.user.organization
    });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { organizationId } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOneAndDelete({ _id: req.params.id, organizationId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a new chat integration (organization-wide, not per ticket)
exports.addChatIntegration = async (req, res) => {
  try {
    const { organizationId, integration } = req.body;
    if (!organizationId || !integration) {
      return res.status(400).json({ success: false, error: 'organizationId and integration are required' });
    }
    // Find any ticket for this org (or create a dummy one if none exists)
    let ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket) {
      ticket = new SupportTicket({
        subject: 'Integration Holder',
        description: 'Holder for chat integrations',
        category: 'general',
        priority: 'low',
        status: 'open',
        customer: { name: 'System', email: 'system@mbz.com' },
        organizationId,
        messages: [],
        hasUnreadMessages: false,
        chatIntegrations: [integration]
      });
      await ticket.save();
      return res.status(201).json({ success: true, data: ticket.chatIntegrations });
    }
    ticket.chatIntegrations.push(integration);
    await ticket.save();
    res.status(201).json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all chat integrations for an organization
exports.getChatIntegrations = async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    res.json({ success: true, data: ticket ? ticket.chatIntegrations : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update a chat integration by index
exports.updateChatIntegration = async (req, res) => {
  try {
    const { organizationId, index, integration } = req.body;
    if (!organizationId || typeof index !== 'number' || !integration) {
      return res.status(400).json({ success: false, error: 'organizationId, index, and integration are required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket || !ticket.chatIntegrations[index]) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    ticket.chatIntegrations[index] = integration;
    await ticket.save();
    res.json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a chat integration by index
exports.deleteChatIntegration = async (req, res) => {
  try {
    const { organizationId, index } = req.body;
    if (!organizationId || typeof index !== 'number') {
      return res.status(400).json({ success: false, error: 'organizationId and index are required' });
    }
    const ticket = await SupportTicket.findOne({ organizationId });
    if (!ticket || !ticket.chatIntegrations[index]) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    ticket.chatIntegrations.splice(index, 1);
    await ticket.save();
    res.json({ success: true, data: ticket.chatIntegrations });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Support Stats Functions for Page Overview
exports.getTotalTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const totalTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    });

    res.json({
      success: true,
      data: { count: totalTickets }
    });
  } catch (error) {
    console.error('Total Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count tickets"
    });
  }
};

exports.getOpenTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const openTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: { $in: ['open', 'in-progress'] }
    });

    res.json({
      success: true,
      data: { count: openTickets }
    });
  } catch (error) {
    console.error('Open Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count open tickets"
    });
  }
};

exports.getResolvedTickets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const resolvedTickets = await SupportTicket.countDocuments({ 
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: { $in: ['resolved', 'closed'] }
    });

    res.json({
      success: true,
      data: { count: resolvedTickets }
    });
  } catch (error) {
    console.error('Resolved Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count resolved tickets"
    });
  }
};

exports.getAvgResponseTime = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          'messages.sender': 'support'
        }
      },
      {
        $unwind: '$messages'
      },
      {
        $match: {
          'messages.sender': 'support'
        }
      },
      {
        $group: {
          _id: '$_id',
          firstResponseTime: {
            $min: {
              $subtract: ['$messages.timestamp', '$createdAt']
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$firstResponseTime' }
        }
      }
    ];

    const result = await SupportTicket.aggregate(pipeline);
    const avgResponseTimeMs = result[0]?.avgResponseTime || 0;
    const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

    res.json({
      success: true,
      data: { 
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 100) / 100
      }
    });
  } catch (error) {
    console.error('Average Response Time Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate average response time"
    });
  }
}; 