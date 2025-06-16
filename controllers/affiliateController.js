const Affiliate = require('../models/Affiliate');
const User = require('../models/users');
const Referral = require('../models/Referral');
const Commission = require('../models/Commission');
const Payout = require('../models/Payout');
const MarketingMaterial = require('../models/MarketingMaterial');
const { generateTrackingCode } = require('../utils/affiliateUtils');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Get all affiliates with pagination and filters
exports.getAffiliates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'user.fullName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const affiliates = await Affiliate.find(query)
      .populate('userId', 'fullName email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Affiliate.countDocuments(query);

    res.json({
      affiliates,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalAffiliates: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single affiliate by ID
exports.getAffiliate = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('marketingMaterials');

    if (!affiliate) {
      return next(new NotFoundError('Affiliate not found'));
    }

    res.json(affiliate);
  } catch (error) {
    next(error);
  }
};

// Create new affiliate
exports.createAffiliate = async (req, res, next) => {
  try {
    const { userId, commissionRate, paymentDetails } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already an affiliate
    const existingAffiliate = await Affiliate.findOne({ userId });
    if (existingAffiliate) {
      return res.status(400).json({ message: 'User is already an affiliate' });
    }

    const affiliate = new Affiliate({
      userId,
      commissionRate,
      paymentDetails,
      trackingCode: await generateTrackingCode(),
      status: 'pending'
    });

    await affiliate.save();

    res.status(201).json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update affiliate
exports.updateAffiliate = async (req, res) => {
  try {
    const { commissionRate, status, paymentDetails } = req.body;

    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    if (commissionRate) affiliate.commissionRate = commissionRate;
    if (status) affiliate.status = status;
    if (paymentDetails) affiliate.paymentDetails = paymentDetails;

    await affiliate.save();

    res.json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete affiliate
exports.deleteAffiliate = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Check if there are any pending commissions or payouts
    const pendingCommissions = await Commission.countDocuments({
      affiliateId: affiliate._id,
      status: 'pending'
    });

    const pendingPayouts = await Payout.countDocuments({
      affiliateId: affiliate._id,
      status: 'pending'
    });

    if (pendingCommissions > 0 || pendingPayouts > 0) {
      return res.status(400).json({
        message: 'Cannot delete affiliate with pending commissions or payouts'
      });
    }

    await affiliate.remove();
    res.json({ message: 'Affiliate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate statistics
exports.getAffiliateStats = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const [
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      totalPayouts
    ] = await Promise.all([
      Referral.countDocuments({ affiliateId: affiliate._id }),
      Referral.countDocuments({ affiliateId: affiliate._id, status: 'converted' }),
      Commission.countDocuments({ affiliateId: affiliate._id }),
      Commission.countDocuments({ affiliateId: affiliate._id, status: 'pending' }),
      Payout.countDocuments({ affiliateId: affiliate._id, status: 'completed' })
    ]);

    const stats = {
      totalReferrals,
      activeReferrals,
      conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
      totalCommissions,
      pendingCommissions,
      totalPayouts,
      earnings: affiliate.earnings
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate performance metrics
exports.getAffiliatePerformance = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const timeRange = req.query.timeRange || '30d';
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const [referrals, commissions, payouts] = await Promise.all([
      Referral.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 }),
      Commission.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 }),
      Payout.find({
        affiliateId: affiliate._id,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: 1 })
    ]);

    const performance = {
      referrals: referrals.map(r => ({
        date: r.createdAt,
        count: 1,
        value: r.conversionValue || 0
      })),
      commissions: commissions.map(c => ({
        date: c.createdAt,
        amount: c.amount
      })),
      payouts: payouts.map(p => ({
        date: p.createdAt,
        amount: p.amount
      }))
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update affiliate settings
exports.updateAffiliateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const affiliate = await Affiliate.findById(req.params.id);
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    affiliate.settings = {
      ...affiliate.settings,
      ...settings
    };

    await affiliate.save();
    res.json(affiliate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate marketing materials
exports.getAffiliateMaterials = async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('marketingMaterials');
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    res.json(affiliate.marketingMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add marketing material to affiliate
exports.addMarketingMaterial = async (req, res) => {
  try {
    const { title, type, url, metadata } = req.body;
    const affiliate = await Affiliate.findById(req.params.id);
    
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    const material = new MarketingMaterial({
      title,
      type,
      url,
      metadata,
      createdBy: req.user._id
    });

    await material.save();
    affiliate.marketingMaterials.push(material._id);
    await affiliate.save();

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all affiliates
exports.getAllAffiliates = async (req, res, next) => {
  try {
    const affiliates = await Affiliate.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: affiliates.length,
      data: {
        affiliates
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update affiliate status
exports.updateAffiliateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return next(new BadRequestError('Invalid status value'));
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update commission rate
exports.updateCommissionRate = async (req, res, next) => {
  try {
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 100) {
      return next(new BadRequestError('Commission rate must be between 0 and 100'));
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    // Get summary statistics
    const stats = await affiliate.getStats();

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get affiliate profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update affiliate profile
exports.updateMyProfile = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        affiliate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get affiliate settings
exports.getMySettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        settings: affiliate.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update affiliate settings
exports.updateMySettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { settings: req.body } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        settings: affiliate.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get payout settings
exports.getPayoutSettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payoutSettings: affiliate.payoutSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update payout settings
exports.updatePayoutSettings = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { payoutSettings: req.body } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        payoutSettings: affiliate.payoutSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get performance metrics
exports.getMyPerformance = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    const performance = await affiliate.getPerformance();

    res.status(200).json({
      status: 'success',
      data: {
        performance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get reports
exports.getMyReports = async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOne({ userId: req.user._id });

    if (!affiliate) {
      return next(new NotFoundError('No affiliate found for this user'));
    }

    const reports = await affiliate.getReports();

    res.status(200).json({
      status: 'success',
      data: {
        reports
      }
    });
  } catch (error) {
    next(error);
  }
}; 