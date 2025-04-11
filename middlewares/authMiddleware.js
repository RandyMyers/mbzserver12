const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Middleware to verify token and authenticate user
exports.authenticateUser = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token is missing or invalid', isAuthenticated: false });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'User is inactive' });
    }

    req.user = user; // Attach user to the request object
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: 'Invalid or expired token', isAuthenticated: false });
  }
};

// Middleware to check roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

// Middleware to ensure the user belongs to the same organization or is a super-admin
exports.verifyOrganization = (req, res, next) => {
  if (
    req.user.role !== 'super-admin' &&
    req.user.organization?.toString() !== req.params.organizationId
  ) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
  }
  next();
};

// Middleware to allow super-admins to access any organization-related data
exports.allowSuperAdminAccess = (req, res, next) => {
  if (req.user.role === 'super-admin') {
    next();
  } else {
    exports.verifyOrganization(req, res, next);
  }
};
