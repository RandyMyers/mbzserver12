const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Organization = require("../models/organization");
const Sender = require("../models/sender");

const sendEmail = require('../helper/senderEmail'); // Import the email sending function

// Register a new user
exports.registerUser = async (req, res) => {
  const { name, businessName, email, password,  } = req.body;
  console.log(req.body);
  const fullName = name;
  const organizationName = businessName; // Use businessName if provided, otherwise use name

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Check if organization already exists
    const existingOrganization = await Organization.findOne({ name: organizationName });
    if (existingOrganization) {
      return res.status(400).json({ success: false, message: 'Organization already exists' });
    }

    // Create a new organization with a random organization code
    const organizationCode = `${organizationName.toLowerCase()}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const newOrganization = new Organization({
      name: organizationName,
      organizationCode,
    });

    // Save the organization to the database
    await newOrganization.save();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(fullName);

    // Create new user and link to organization
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      organization: newOrganization._id, // Link to the newly created organization
      organizationCode: newOrganization.organizationCode
    });

    // Save the new user to the database
    await newUser.save();

    const name = "Sales Sender";

    // Find the sender by name and senderId
    const sender = await Sender.findOne({
        name,
      });

      if (!sender) {
        return res.status(404).json({ success: false, message: 'Sender not found' });
      }

      

    // Prepare email content
    const emailContent = {
      senderId: sender._id, // Use the super-admin sender ID
      createdBy: sender.userId,
      organization: sender.organization,
      emailTemplate: sender.emailTemplate,
      variables: sender.variables,
      from: sender.email,
      to: email,
      subject: 'Welcome to Your Organization',
      html: `
        <p>Hello ${username},</p>
        <p>Welcome to your new organization: ${organizationName}.</p>
        
        <p>Your Organization Code: ${organizationCode}</p>
        <p>Best regards,</p>
        <p>The Admin Team</p>
      `,
    };

    // Send the email
    await sendEmail(emailContent);

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      userId: newUser._id,
      username: newUser.username, // Assuming name refers to username
      email: newUser.email,
      role: newUser.role,
      token,
      organizationCode: newUser.organizationCode,
      organizationId: newOrganization._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


  // Register a Super Admin
exports.registerSuperAdmin = async (req, res) => {
    const { username, name, email, password, role } = req.body;
    console.log(req.body);
  
    try {
      // Ensure the role is super-admin
      if (role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized role assignment' });
      }
  
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new super admin user
      const newSuperAdmin = new User({
        username,
        email,
        password: hashedPassword,
        role,
      });
  
      // Save the user
      await newSuperAdmin.save();
  
      res.status(201).json({ success: true, message: 'Super Admin registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  exports.loginSuperAdmin = async (req, res) => {
    const { username, password } = req.body;

    console.log(req.body);
  
    try {
      const user = await User.findOne({ username, role: 'super-admin' }); // Search by username
      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found or unauthorized' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        userId: user._id,
      
          username: user.username, // Include username
          email: user.email,
          userRole: user.role,
          profilePicture: user.profilePicture,
          status: user.status,
        
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

  // Login a user
exports.loginUser = async (req, res) => {
    
    const { email, password } = req.body;
  console.log(req.body);
    try {
      // Find the user by email and organization
      const user = await User.findOne({ email});
      if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
      }

      // Find the organization by its code
      const organization = await Organization.findOne({ organizationCode: user.organizationCode });
      if (!organization) {
        return res.status(400).json({ success: false, message: "Invalid organization code" });
      }
  
      console.log(organization);
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
         userId: user._id,
          username: user.username, // Assuming name refers to username
          email: user.email,
          role: user.role,
          organizationId: organization._id,
          organization: organization.name,
          organizationCode: user.organizationCode,
          profilePicture: user.profilePicture,
          status: user.status,
       
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  // Change password for a user in an organization
// Change password for a regular user based on organizationId
exports.changePassword = async (req, res) => {
  const { userId, organizationId, currentPassword, newPassword } = req.body;
  console.log(req.body);
  try {
    // Find the organization by organizationId
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Find the user who belongs to this organization
    const user = await User.findOne({ _id: userId, organizationCode: organization.organizationCode  });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in this organization' });
    }

    // Compare the current password with the stored password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


  

// Change password for a super admin
exports.changePasswordSuperAdmin = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const loggedInUserId = req.userId; // Assuming the logged-in user's ID is stored in req.userId from the JWT

  try {
    // Check if the logged-in user is a super admin
    const loggedInUser = await User.findById(loggedInUserId);
    if (loggedInUser.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Find the user whose password is to be changed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If it's the logged-in super admin changing their own password
    if (loggedInUserId === userId) {
      // Compare current password with the stored password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    // If changing another user's password, check if the user is also a super admin
    if (user.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Only super admins can change other super admin passwords' });
    }

    // Hash the new password for the super admin user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Super Admin password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

