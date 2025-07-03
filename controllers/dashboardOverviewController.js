const Order = require('../models/order');
const Customer = require('../models/customers');
const Product = require('../models/inventory');
const Website = require('../models/website');
const Task = require('../models/task');
const Campaign = require('../models/campaign');
const SupportTicket = require('../models/supportTicket');
const currencyUtils = require('../utils/currencyUtils');
const mongoose = require('mongoose');

// Helper function to calculate date range
const getDateRange = (timeRange) => {
  const now = new Date();
  const ranges = {
    '7d': new Date(new Date().setDate(now.getDate() - 7)),
    '30d': new Date(new Date().setDate(now.getDate() - 30)),
    '90d': new Date(new Date().setDate(now.getDate() - 90)),
    '12m': new Date(new Date().setDate(now.getDate() - 365)),
    'ytd': new Date(new Date(now.getFullYear(), 0, 1))
  };
  return ranges[timeRange] || ranges['30d'];
};

// Helper function to calculate previous period for growth comparison
const getPreviousPeriod = (startDate, endDate) => {
  const periodLength = endDate - startDate;
  const previousEndDate = new Date(startDate);
  const previousStartDate = new Date(startDate - periodLength);
  return { previousStartDate, previousEndDate };
};

exports.getDashboardOverview = async (req, res) => {
  try {
    const { timeRange = '30d', organizationId, userId, displayCurrency } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const startDate = getDateRange(timeRange);
    const endDate = new Date();
    const { previousStartDate, previousEndDate } = getPreviousPeriod(startDate, endDate);
    
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // 1. Revenue Analytics with Multi-Currency Support
    const currentRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId,
      targetCurrency,
      { date_created: { $gte: startDate, $lte: endDate } }
    );
    const currentRevenueResults = await Order.aggregate(currentRevenuePipeline);
    const currentRevenueSummary = await currencyUtils.processMultiCurrencyResults(
      currentRevenueResults, 
      targetCurrency, 
      organizationId
    );

    const previousRevenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId,
      targetCurrency,
      { date_created: { $gte: previousStartDate, $lt: startDate } }
    );
    const previousRevenueResults = await Order.aggregate(previousRevenuePipeline);
    const previousRevenueSummary = await currencyUtils.processMultiCurrencyResults(
      previousRevenueResults, 
      targetCurrency, 
      organizationId
    );

    const revenueGrowth = previousRevenueSummary.totalConverted > 0
      ? ((currentRevenueSummary.totalConverted - previousRevenueSummary.totalConverted) / previousRevenueSummary.totalConverted) * 100
      : 0;

    // 2. Orders Analytics
    const currentOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled', 'refunded'] }
    });

    const previousOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate },
      status: { $nin: ['cancelled', 'refunded'] }
    });

    const ordersGrowth = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

    // 3. Customers Analytics
    const currentCustomers = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousCustomers = await Customer.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const customersGrowth = previousCustomers > 0
      ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
      : 0;

    // 4. Inventory Analytics
    const currentInventory = await Product.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousInventory = await Product.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const inventoryGrowth = previousInventory > 0
      ? ((currentInventory - previousInventory) / previousInventory) * 100
      : 0;

    // 5. Websites Analytics
    const currentWebsites = await Website.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousWebsites = await Website.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const websitesGrowth = previousWebsites > 0
      ? ((currentWebsites - previousWebsites) / previousWebsites) * 100
      : 0;

    // 6. Tasks Analytics
    const currentTasks = await Task.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousTasks = await Task.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const tasksGrowth = previousTasks > 0
      ? ((currentTasks - previousTasks) / previousTasks) * 100
      : 0;

    // 7. Campaigns Analytics
    const currentCampaigns = await Campaign.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousCampaigns = await Campaign.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const campaignsGrowth = previousCampaigns > 0
      ? ((currentCampaigns - previousCampaigns) / previousCampaigns) * 100
      : 0;

    // 8. Support Tickets Analytics
    const currentTickets = await SupportTicket.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate, $lte: endDate }
    });

    const previousTickets = await SupportTicket.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: previousStartDate, $lt: startDate }
    });

    const ticketsGrowth = previousTickets > 0
      ? ((currentTickets - previousTickets) / previousTickets) * 100
      : 0;

    // 9. Recent Orders with Currency Conversion
    const recentOrders = await Order.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: { $nin: ['cancelled', 'refunded'] }
    })
    .sort({ date_created: -1 })
    .limit(5)
    .populate('customerId', 'fullName email')
    .lean();

    const convertedRecentOrders = await currencyUtils.convertOrderAmounts(
      recentOrders,
      targetCurrency,
      organizationId
    );

    // 10. Currency Statistics
    const currencyStats = await currencyUtils.getCurrencyStats(organizationId);

    res.json({
      success: true,
      data: {
        overview: {
          revenue: {
            current: currentRevenueSummary.totalConverted,
            previous: previousRevenueSummary.totalConverted,
            growth: revenueGrowth,
            currency: targetCurrency,
            currencyBreakdown: currentRevenueSummary.currencyBreakdown
          },
          orders: {
            current: currentOrders,
            previous: previousOrders,
            growth: ordersGrowth
          },
          customers: {
            current: currentCustomers,
            previous: previousCustomers,
            growth: customersGrowth
          },
          inventory: {
            current: currentInventory,
            previous: previousInventory,
            growth: inventoryGrowth
          },
          websites: {
            current: currentWebsites,
            previous: previousWebsites,
            growth: websitesGrowth
          },
          tasks: {
            current: currentTasks,
            previous: previousTasks,
            growth: tasksGrowth
          },
          campaigns: {
            current: currentCampaigns,
            previous: previousCampaigns,
            growth: campaignsGrowth
          },
          supportTickets: {
            current: currentTickets,
            previous: previousTickets,
            growth: ticketsGrowth
          }
        },
        recentOrders: convertedRecentOrders,
        currencyStats,
        timeRange: {
          current: { start: startDate, end: endDate },
          previous: { start: previousStartDate, end: previousEndDate }
        }
      }
    });

  } catch (error) {
    console.error('Dashboard Overview Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard overview"
    });
  }
}; 