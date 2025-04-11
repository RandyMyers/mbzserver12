const User = require('../models/users');
const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;

// Create a new user within the same organization as the admin

exports.createUser = async (req, res) => {
  const { userId, name, email, password, role, department } = req.body;

  try {
    const admin = await User.findById(userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const organization = await Organization.findById(admin.organization);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePictureUrl = null;

    if (req.files && req.files.profilePicture) {
      const result = await cloudinary.uploader.upload(req.files.profilePicture.tempFilePath, {
        folder: "profile_pictures",
      });
      profilePictureUrl = result.secure_url;
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department,
      organization: organization._id,
      profilePicture: profilePictureUrl,
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "User created", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get all users in an organization
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("organization");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId).populate("organization");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user details (e.g., name, email, role)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, username, email, department, role, status, profilePicture } = req.body;
  console.log(req.body);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user fields
    user.name = name || user.name;
    user.username = username || user.username;
    user.department = department || user.department;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;
    user.profilePicture = profilePicture || user.profilePicture;

    // Save updated user
    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user status (active/inactive)
exports.updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  console.log(req.params);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;  // 'active' or 'inactive'
    await user.save();

    res.status(200).json({ success: true, message: "User status updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get users by organization
exports.getUsersByOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    // Fetch all users belonging to the specified organization
    const users = await User.find({ organization: organizationId }).populate("organization");

    console.log('users for the organization', users);
    if (!users.length) {
      return res.status(404).json({ success: false, message: "No users found for this organization." });
    }

    // Count users by role
    const roleCounts = users.reduce((counts, user) => {
      const role = user.role; // Assuming `role` is the field in the User schema
      counts[role] = counts[role] ? counts[role] + 1 : 1;
      return counts;
    }, {});

    console.log(roleCounts);

    res.status(200).json({ success: true, users, roleCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete the user
    await user.remove();

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  const { userId } = req.params;

  try {
    // Ensure a file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.files.profilePicture;
    console.log(file);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "profile_pictures",
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update the user's profile picture URL
    user.profilePicture = result.secure_url;
    await user.save();

    console.log(user.profilePicture);

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

