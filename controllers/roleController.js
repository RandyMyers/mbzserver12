const Role = require('../models/role');

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = new Role({ name, description, permissions });
    await role.save();
    res.status(201).json({ success: true, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
};

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json({ success: true, roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

// Get a role by ID
exports.getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch role' });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;
    const role = await Role.findByIdAndUpdate(
      roleId,
      { name, description, permissions, updatedAt: Date.now() },
      { new: true }
    );
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await Role.findByIdAndDelete(roleId);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
}; 