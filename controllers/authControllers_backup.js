const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/users");
const Organization = require("../models/organization");

// SMTP Configuration for system emails
const smtpConfig = {
  host: 'mbztechnology.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'hello@mbztechnology.com',
    pass: 'Dontmesswithus@01'
  }
};

// Create transporter for system emails
const systemTransporter = nodemailer.createTransport(smtpConfig);

// Send system email function
const sendSystemEmail = async (to, subject, html) => {
  try {
    const info = await systemTransporter.sendMail({
      from: 'hello@mbztechnology.com',
      to,
      subject,
      html
    });
    console.log('System email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending system email:', error);
    throw error;
  }
};

// ========================================
// SUPER ADMIN REGISTRATION & LOGIN
// ========================================

// Register a Super Admin (Platform Owner)
exports.registerSuperAdmin = async (req, res) => {
  const { username, fullName, email, password } = req.body;
  console.log('Super Admin Registration:', req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new super admin user
    const newSuperAdmin = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      role: 'super-admin', // Direct role assignment
      status: 'active'
    });

    // Save the user
    await newSuperAdmin.save();

    // Send welcome email
    try {
      await sendSystemEmail(
        email,
        'Welcome to MBZ Technology Platform - Super Admin Account Created',
        `
          <h2>Welcome to MBZ Technology Platform!</h2>
          <p>Hello ${fullName},</p>
          <p>Your Super Admin account has been successfully created.</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>You now have full access to manage the platform and all organizations.</p>
          <p>Best regards,<br>MBZ Technology Team</p>
        `
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }
    

    res.status(201).json({ 
      success: true, 
      message: 'Super Admin registered successfully',
      userId: newSuperAdmin._id,
      username: newSuperAdmin.username,
      email: newSuperAdmin.email,
      role: newSuperAdmin.role
    });
  } catch (error) {
    console.error('Super Admin registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login Super Admin
exports.loginSuperAdmin = async (req, res) => {
  const { username, password } = req.body;
  console.log('Super Admin Login:', req.body);

  try {
    const user = await User.findOne({ 
      username, 
      role: 'super-admin' 
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found or unauthorized' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Super Admin login successful',
      token,
      userId: user._id,
      username: user.username,
      email: user.email,
      userRole: user.role,
      profilePicture: user.profilePicture,
      status: user.status
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// ORGANIZATION USER REGISTRATION & LOGIN
// ========================================

// Register an Organization User (Business Owner/Manager)
exports.registerOrganizationUser = async (req, res) => {
  const { fullName, businessName, email, password } = req.body;
  console.log('Organization User Registration:', req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Check if organization already exists
    const existingOrganization = await Organization.findOne({ name: businessName });
    if (existingOrganization) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization with this name already exists' 
      });
    }

    // Create a new organization with a unique organization code
    const organizationCode = `${businessName.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    const newOrganization = new Organization({
      name: businessName,
      organizationCode,
      status: 'active'
    });

    // Save the organization
    await newOrganization.save();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user and link to organization
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'admin', // Organization admin role
      organization: newOrganization._id,
      organizationCode: newOrganization.organizationCode,
      status: 'active'
    });

    // Save the user
    await newUser.save();

    // Send welcome email
    try {
      await sendSystemEmail(
        email,
        'Welcome to MBZ Technology - Your Business Account is Ready!',
        `
          <h2>Welcome to MBZ Technology!</h2>
          <p>Hello ${fullName},</p>
          <p>Your business account has been successfully created.</p>
          <p><strong>Business Name:</strong> ${businessName}</p>
          <p><strong>Organization Code:</strong> ${organizationCode}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>You can now log in to your dashboard and start managing your business operations.</p>
          <p>Best regards,<br>MBZ Technology Team</p>
        `
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Organization user registered successfully',
      userId: newUser._id,
      username: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      token,
      organizationCode: newUser.organizationCode,
      organizationId: newOrganization._id,
      organization: newOrganization.name
    });
  } catch (error) {
    console.error('Organization user registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login Organization User
exports.loginOrganizationUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('Organization User Login:', req.body);

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user belongs to an organization (not super admin)
    if (!user.organization) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user type" 
      });
    }

    // Find the organization
    const organization = await Organization.findOne({ 
      organizationCode: user.organizationCode 
    });
    if (!organization) {
      return res.status(400).json({ 
        success: false, 
        message: "Organization not found" 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,
      username: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: organization._id,
      organization: organization.name,
      organizationCode: user.organizationCode,
      profilePicture: user.profilePicture,
      status: user.status
    });
  } catch (error) {
    console.error('Organization user login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// AFFILIATE REGISTRATION & LOGIN
// ========================================

// Register an Affiliate User
exports.registerAffiliate = async (req, res) => {
  const { fullName, email, password, referralCode } = req.body;
  console.log('Affiliate Registration:', req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new affiliate user
    const newAffiliate = new User({
      fullName,
      email,
      password: hashedPassword,
      role: 'affiliate', // Affiliate role
      status: 'active',
      // Add affiliate-specific fields if needed
      affiliateData: {
        referralCode: referralCode || null,
        joinDate: new Date(),
        status: 'pending' // pending, active, suspended
      }
    });

    // Save the user
    await newAffiliate.save();

    // Send welcome email
    try {
      await sendSystemEmail(
        email,
        'Welcome to MBZ Technology - Affiliate Account Created',
        `
          <h2>Welcome to MBZ Technology Affiliate Program!</h2>
          <p>Hello ${fullName},</p>
          <p>Your affiliate account has been successfully created.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Your account is currently pending approval. You will receive notification once approved.</p>
          <p>Best regards,<br>MBZ Technology Team</p>
        `
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    const token = jwt.sign(
      { userId: newAffiliate._id, role: newAffiliate.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Affiliate registered successfully',
      userId: newAffiliate._id,
      username: newAffiliate.fullName,
      email: newAffiliate.email,
      role: newAffiliate.role,
      token
    });
  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login Affiliate User
exports.loginAffiliate = async (req, res) => {
  const { email, password } = req.body;
  console.log('Affiliate Login:', req.body);

  try {
    // Find the user by email
    const user = await User.findOne({ email, role: 'affiliate' });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found or not an affiliate" 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Affiliate login successful",
      token,
      userId: user._id,
      username: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      status: user.status
    });
  } catch (error) {
    console.error('Affiliate login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========================================
// PASSWORD CHANGE FUNCTIONS
// ========================================

// Change password for organization user
exports.changePassword = async (req, res) => {
  const { userId, organizationId, currentPassword, newPassword } = req.body;
  console.log('Change Password Request:', req.body);

  try {
    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    // Find the user who belongs to this organization
    const user = await User.findOne({ 
      _id: userId, 
      organizationCode: organization.organizationCode 
    });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in this organization' 
      });
    }

    // Compare the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incorrect current password' 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change password for super admin
exports.changePasswordSuperAdmin = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const loggedInUserId = req.userId;

  try {
    // Check if the logged-in user is a super admin
    const loggedInUser = await User.findById(loggedInUserId);
    if (loggedInUser.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    // Find the user whose password is to be changed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // If changing own password
    if (loggedInUserId === userId) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Incorrect current password' 
        });
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Super Admin password updated successfully' 
    });
  } catch (error) {
    console.error('Super admin change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========================================
// LEGACY SUPPORT (for backward compatibility)
// ========================================

// Legacy register user function (redirects to organization user registration)
exports.registerUser = async (req, res) => {
  console.log('Legacy registerUser called, redirecting to organization registration');
  // Map the client data to the expected format
  const { firstName, lastName, email, password, companyName, referralCode } = req.body;
  
  const mappedData = {
    fullName: `${firstName} ${lastName}`,
    businessName: companyName,
    email,
    password,
    referralCode
  };
  
  // Create a new request object with mapped data
  const newReq = {
    ...req,
    body: mappedData
  };
  
  return exports.registerOrganizationUser(newReq, res);
};

// Legacy login user function (redirects to organization user login)
exports.loginUser = async (req, res) => {
  console.log('Legacy loginUser called, redirecting to organization login');
  return exports.loginOrganizationUser(req, res);
};

