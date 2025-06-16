const Referral = require('../models/Referral');
const Affiliate = require('../models/Affiliate');
const Commission = require('../models/Commission');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Get all referrals with pagination and filters
exports.getReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const affiliateId = req.query.affiliateId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};
    if (status) query.status = status;
    if (affiliateId) query.affiliateId = affiliateId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const referrals = await Referral.find(query)
      .populate('affiliateId', 'trackingCode')
      .populate('referredUserId', 'fullName email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Referral.countDocuments(query);

    res.json({
      referrals,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReferrals: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single referral by ID
exports.getReferral = async (req, res, next) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('referredUserId', 'fullName email');

    if (!referral) {
      return next(new NotFoundError('No referral found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        referral
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new referral
exports.createReferral = async (req, res, next) => {
  try {
    const referral = await Referral.create({
      ...req.body,
      affiliateId: req.params.affiliateId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        referral
      }
    });
  } catch (error) {
    next(error);
  }
};

// Convert referral
exports.convertReferral = async (req, res) => {
  try {
    const { conversionValue } = req.body;
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ message: 'Referral is not in pending status' });
    }

    const affiliate = await Affiliate.findById(referral.affiliateId);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Calculate commission
    const commissionAmount = (conversionValue * affiliate.commissionRate) / 100;

    // Create commission record
    const commission = new Commission({
      affiliateId: affiliate._id,
      referralId: referral._id,
      amount: commissionAmount,
      metadata: {
        conversionValue,
        commissionRate: affiliate.commissionRate
      }
    });

    await commission.save();

    // Update referral status
    referral.status = 'converted';
    referral.conversionValue = conversionValue;
    referral.convertedAt = new Date();
    await referral.save();

    // Update affiliate earnings
    await affiliate.updateEarnings(commissionAmount);

    res.json({ referral, commission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel referral
exports.cancelReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending referrals can be cancelled' });
    }

    referral.status = 'cancelled';
    await referral.save();

    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get referral statistics
exports.getReferralStats = async (req, res) => {
  try {
    const affiliateId = req.query.affiliateId;
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

    const query = { createdAt: { $gte: startDate } };
    if (affiliateId) query.affiliateId = affiliateId;

    const [totalReferrals, convertedReferrals, cancelledReferrals] = await Promise.all([
      Referral.countDocuments(query),
      Referral.countDocuments({ ...query, status: 'converted' }),
      Referral.countDocuments({ ...query, status: 'cancelled' })
    ]);

    const stats = {
      totalReferrals,
      convertedReferrals,
      cancelledReferrals,
      conversionRate: totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0,
      cancellationRate: totalReferrals > 0 ? (cancelledReferrals / totalReferrals) * 100 : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get referral timeline
exports.getReferralTimeline = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('referredUserId', 'fullName email');

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    const timeline = [
      {
        date: referral.createdAt,
        event: 'Referral Created',
        details: {
          source: referral.source,
          trackingCode: referral.trackingCode
        }
      }
    ];

    if (referral.status === 'converted') {
      timeline.push({
        date: referral.convertedAt,
        event: 'Referral Converted',
        details: {
          conversionValue: referral.conversionValue
        }
      });

      // Add commission creation to timeline
      const commission = await Commission.findOne({ referralId: referral._id });
      if (commission) {
        timeline.push({
          date: commission.createdAt,
          event: 'Commission Created',
          details: {
            amount: commission.amount
          }
        });
      }
    } else if (referral.status === 'cancelled') {
      timeline.push({
        date: referral.updatedAt,
        event: 'Referral Cancelled'
      });
    }

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate referrals
exports.getAffiliateReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.find({ affiliateId: req.params.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: referrals.length,
      data: {
        referrals
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get my referrals (for affiliate)
exports.getMyReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.find({ affiliateId: req.user.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: referrals.length,
      data: {
        referrals
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get referral statistics
exports.getMyReferralStats = async (req, res, next) => {
  try {
    const stats = await Referral.aggregate([
      {
        $match: { affiliateId: req.user.affiliateId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$conversionValue' }
        }
      }
    ]);

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

// Get referral report
exports.getMyReferralReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { affiliateId: req.user.affiliateId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: referrals.length,
      data: {
        referrals
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update referral
exports.updateReferral = async (req, res, next) => {
  try {
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!referral) {
      return next(new NotFoundError('No referral found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        referral
      }
    });
  } catch (error) {
    next(error);
  }
}; 