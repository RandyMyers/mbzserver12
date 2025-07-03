const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/users');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new UnauthorizedError('User recently changed password. Please log in again.'));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Restrict access to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

// Check if user is authenticated but not required
exports.isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Check if user is the owner of the resource
exports.isOwner = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findById(req.params.id);
    
    if (!doc) {
      return next(new NotFoundError('No document found with that ID'));
    }

    if (doc.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is part of the organization
exports.isOrganizationMember = async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return next(new ForbiddenError('You are not part of any organization'));
    }

    if (req.params.organizationId && req.params.organizationId !== req.user.organizationId.toString()) {
      return next(new ForbiddenError('You do not have access to this organization'));
    }

    next();
  } catch (error) {
    next(error);
  }
}; 