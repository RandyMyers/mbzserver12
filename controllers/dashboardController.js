const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const Website = require('../models/website');
const Task = require('../models/task');
const Campaign = require('../models/campaigns');
const SupportTicket = require('../models/support');
const mongoose = require('mongoose');
const currencyUtils = require('../utils/currencyUtils');

// Helper function to calculate date range for growth comparison
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

// Dashboard Overview Stats
exports.getOverviewStats = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId, displayCurrency } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    // Determine display currency
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency revenue aggregation
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(organizationId);
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency);

    // Other stats (unchanged)
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalWebsites,
      totalTasks,
      totalCampaigns,
      totalTickets
    ] = await Promise.all([
      // Orders
      Order.countDocuments({
        organizationId: orgId,
        status: { $nin: ['cancelled', 'refunded'] }
      }),
      // Customers
      Customer.countDocuments({
        organizationId: orgId
      }),
      // Products
      Inventory.countDocuments({
        organizationId: orgId
      }),
      // Websites
      Website.countDocuments({
        organization: orgId
      }),
      // Tasks
      Task.countDocuments({
        organization: orgId
      }),
      // Campaigns
      Campaign.countDocuments({
        organization: orgId
      }),
      // Support Tickets
      SupportTicket.countDocuments({
        organizationId: orgId
      })
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueSummary.totalConverted,
        revenueCurrency: revenueSummary.targetCurrency,
        revenueBreakdown: revenueSummary.currencyBreakdown,
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
        websites: totalWebsites,
        tasks: totalTasks,
        campaigns: totalCampaigns,
        tickets: totalTickets
      }
    });
  } catch (error) {
    console.error('Dashboard Overview Stats Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get dashboard overview stats"
    });
  }
}; 