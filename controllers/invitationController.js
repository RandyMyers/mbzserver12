const Invitation = require('../models/invitation');
const User = require('../models/users');
const Organization = require('../models/organization');
const crypto = require('crypto');

// Create a new invitation
exports.createInvitation = async (req, res) => {
  try {
    const { email, invitedBy, organization, expiresAt } = req.body;
    const token = crypto.randomBytes(24).toString('hex');
    const invitation = new Invitation({
      email,
      invitedBy,
      organization,
      token,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days
    });
    await invitation.save();
    res.status(201).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create invitation' });
  }
};

// Get all invitations (optionally by organization)
exports.getInvitations = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const filter = organizationId ? { organization: organizationId } : {};
    const invitations = await Invitation.find(filter).populate('invitedBy organization');
    res.status(200).json({ success: true, invitations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
  }
};

// Get an invitation by ID
exports.getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findById(invitationId).populate('invitedBy organization');
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch invitation' });
  }
};

// Resend invitation (reset token and expiresAt)
exports.resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const token = crypto.randomBytes(24).toString('hex');
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      { token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: 'pending' },
      { new: true }
    );
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to resend invitation' });
  }
};

// Cancel invitation
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      { status: 'cancelled' },
      { new: true }
    );
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel invitation' });
  }
};

// Accept invitation (create user, mark invitation as accepted)
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const invitation = await Invitation.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } });
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found or expired' });
    // Create user logic here (or trigger registration flow)
    invitation.status = 'accepted';
    await invitation.save();
    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
};

// Delete invitation
exports.deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findByIdAndDelete(invitationId);
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.status(200).json({ success: true, message: 'Invitation deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete invitation' });
  }
}; 