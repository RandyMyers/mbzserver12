const Commission = require('../models/Commission');
const Affiliate = require('../models/Affiliate');
const Payout = require('../models/Payout');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Get all commissions with pagination and filters
exports.getCommissions = async (req, res) => {
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

    const commissions = await Commission.find(query)
      .populate('affiliateId', 'trackingCode')
      .populate('referralId', 'trackingCode conversionValue')
      .populate('payoutId', 'amount status')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Commission.countDocuments(query);

    res.json({
      commissions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCommissions: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single commission by ID
exports.getCommission = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('referralId', 'trackingCode conversionValue')
      .populate('payoutId', 'amount status');

    if (!commission) {
      return next(new NotFoundError('No commission found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        commission
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new commission
exports.createCommission = async (req, res, next) => {
  try {
    const commission = await Commission.create({
      ...req.body,
      affiliateId: req.params.affiliateId
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        commission
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark commission as paid
exports.markCommissionAsPaid = async (req, res) => {
  try {
    const { payoutId } = req.body;
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({ message: 'Commission is not in pending status' });
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    commission.status = 'paid';
    commission.payoutId = payoutId;
    commission.paidAt = new Date();
    await commission.save();

    res.json(commission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel commission
exports.cancelCommission = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending commissions can be cancelled' });
    }

    const affiliate = await Affiliate.findById(commission.affiliateId);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Update affiliate's pending earnings
    affiliate.pendingEarnings -= commission.amount;
    await affiliate.save();

    commission.status = 'cancelled';
    await commission.save();

    res.json(commission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get commission statistics
exports.getCommissionStats = async (req, res) => {
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

    const [totalCommissions, pendingCommissions, paidCommissions] = await Promise.all([
      Commission.countDocuments(query),
      Commission.countDocuments({ ...query, status: 'pending' }),
      Commission.countDocuments({ ...query, status: 'paid' })
    ]);

    const [totalAmount, pendingAmount, paidAmount] = await Promise.all([
      Commission.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: { ...query, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: { ...query, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const stats = {
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      totalAmount: totalAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get commission timeline
exports.getCommissionTimeline = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('affiliateId', 'trackingCode')
      .populate('referralId', 'trackingCode conversionValue')
      .populate('payoutId', 'amount status');

    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    const timeline = [
      {
        date: commission.createdAt,
        event: 'Commission Created',
        details: {
          amount: commission.amount,
          referralId: commission.referralId?._id
        }
      }
    ];

    if (commission.status === 'paid') {
      timeline.push({
        date: commission.paidAt,
        event: 'Commission Paid',
        details: {
          payoutId: commission.payoutId?._id,
          amount: commission.amount
        }
      });
    } else if (commission.status === 'cancelled') {
      timeline.push({
        date: commission.updatedAt,
        event: 'Commission Cancelled'
      });
    }

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get affiliate commissions
exports.getAffiliateCommissions = async (req, res, next) => {
  try {
    const commissions = await Commission.find({ affiliateId: req.params.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: commissions.length,
      data: {
        commissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get my commissions (for affiliate)
exports.getMyCommissions = async (req, res, next) => {
  try {
    const commissions = await Commission.find({ affiliateId: req.user.affiliateId });
    
    res.status(200).json({
      status: 'success',
      results: commissions.length,
      data: {
        commissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get commission statistics
exports.getMyCommissionStats = async (req, res, next) => {
  try {
    const stats = await Commission.aggregate([
      {
        $match: { affiliateId: req.user.affiliateId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
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

// Get commission report
exports.getMyCommissionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { affiliateId: req.user.affiliateId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const commissions = await Commission.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: commissions.length,
      data: {
        commissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update commission
exports.updateCommission = async (req, res, next) => {
  try {
    const commission = await Commission.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!commission) {
      return next(new NotFoundError('No commission found with that ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        commission
      }
    });
  } catch (error) {
    next(error);
  }
}; 