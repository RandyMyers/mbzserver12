const Group = require('../models/group');
const User = require('../models/users');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, organization } = req.body;
    const group = new Group({ name, description, organization });
    await group.save();
    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
};

// Get all groups (optionally by organization)
exports.getGroups = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const filter = organizationId ? { organization: organizationId } : {};
    const groups = await Group.find(filter).populate('members');
    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
};

// Get a group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch group' });
  }
};

// Update a group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const group = await Group.findByIdAndUpdate(
      groupId,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update group' });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.status(200).json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
};

// Add user to group
exports.addUserToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    if (!group.members.includes(userId)) group.members.push(userId);
    await group.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { groups: groupId } });
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add user to group' });
  }
};

// Remove user from group
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();
    await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to remove user from group' });
  }
}; 