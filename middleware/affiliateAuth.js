const Affiliate = require('../models/Affiliate');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

// Middleware to check if user is an affiliate
exports.isAffiliate = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      throw new UnauthorizedError('User is not an affiliate');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if affiliate has required permissions
exports.hasAffiliatePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const affiliate = await Affiliate.findOne({ userId: req.user._id });
      
      if (!affiliate) {
        throw new UnauthorizedError('User is not an affiliate');
      }

      if (affiliate.status !== 'active') {
        throw new ForbiddenError('Affiliate account is not active');
      }

      // Check if affiliate has the required permission
      if (!affiliate.permissions || !affiliate.permissions[permission]) {
        throw new ForbiddenError(`Affiliate does not have ${permission} permission`);
      }

      req.affiliate = affiliate;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to validate affiliate tracking code
exports.validateTrackingCode = async (req, res, next) => {
  try {
    const { trackingCode } = req.params;

    const affiliate = await Affiliate.findOne({ trackingCode });
    
    if (!affiliate) {
      throw new UnauthorizedError('Invalid tracking code');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if affiliate can create payouts
exports.canCreatePayout = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      throw new UnauthorizedError('User is not an affiliate');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    // Check if affiliate has enough pending earnings
    if (affiliate.earnings.pending < affiliate.settings.minimumPayout) {
      throw new ForbiddenError('Insufficient pending earnings for payout');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if affiliate can access marketing materials
exports.canAccessMaterials = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      throw new UnauthorizedError('User is not an affiliate');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    // Check if affiliate has access to marketing materials
    if (!affiliate.permissions || !affiliate.permissions.accessMaterials) {
      throw new ForbiddenError('Affiliate does not have access to marketing materials');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if affiliate can track conversions
exports.canTrackConversions = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      throw new UnauthorizedError('User is not an affiliate');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    // Check if affiliate has permission to track conversions
    if (!affiliate.permissions || !affiliate.permissions.trackConversions) {
      throw new ForbiddenError('Affiliate does not have permission to track conversions');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if affiliate can view reports
exports.canViewReports = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });
    
    if (!affiliate) {
      throw new UnauthorizedError('User is not an affiliate');
    }

    if (affiliate.status !== 'active') {
      throw new ForbiddenError('Affiliate account is not active');
    }

    // Check if affiliate has permission to view reports
    if (!affiliate.permissions || !affiliate.permissions.viewReports) {
      throw new ForbiddenError('Affiliate does not have permission to view reports');
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    next(error);
  }
}; 