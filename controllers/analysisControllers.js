const Order = require('../models/order');
const Customer = require('../models/customers');
const Product = require('../models/inventory');
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

exports.totalRevenue = async (req, res) => {
    try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency revenue aggregation with time filter
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId, 
      targetCurrency, 
      { date_created: { $gte: startDate } }
    );
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency, organizationId);

    res.json({
      success: true,
      data: { 
        totalRevenue: revenueSummary.totalConverted,
        currency: revenueSummary.targetCurrency,
        currencyBreakdown: revenueSummary.currencyBreakdown,
        timeRange: {
          start: startDate,
          end: new Date()
        }
      }
    });
    } catch (error) {
    console.error('Total Revenue Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate total revenue"
    });
  }
};

// Total Orders
exports.totalOrders = async (req, res) => {
    try {
    const { timeRange, organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const startDate = getDateRange(timeRange);

    const query = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['cancelled', 'refunded'] },
      total: { $exists: true, $ne: "" } // Only count orders with a total
    };

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: { 
        totalOrders,
        timeRange: {
          start: startDate,
          end: new Date() // Include end date for clarity
        }
      }
    });
    } catch (error) {
    console.error('Total Orders Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to count orders"
    });
    }
  };

// New Customers
exports.newCustomers = async (req, res) => {
    try {
    const { timeRange, organizationId } = req.query;
    
    const startDate = getDateRange(timeRange);

    const query = {
      organizationId,
      date_created: { $gte: startDate }
    };

    const newCustomers = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: { newCustomers }
    });
    } catch (error) {
    console.error('New Customers Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
    }
  };

// Average Order Value
exports.averageOrderValue = async (req, res) => {
    try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    // Multi-currency average order value calculation
    const revenuePipeline = currencyUtils.createMultiCurrencyRevenuePipeline(
      organizationId, 
      targetCurrency, 
      { date_created: { $gte: startDate } }
    );
    const revenueResults = await Order.aggregate(revenuePipeline);
    const revenueSummary = await currencyUtils.processMultiCurrencyResults(revenueResults, targetCurrency, organizationId);

    // Get total order count for the period
    const totalOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['cancelled', 'refunded'] }
    });
    
    const averageOrderValue = totalOrders > 0 ? revenueSummary.totalConverted / totalOrders : 0;

    res.json({
      success: true,
      data: { 
        averageOrderValue,
        currency: revenueSummary.targetCurrency,
        totalOrders
      }
    });
    } catch (error) {
    console.error('Average Order Value Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Return Rate
exports.returnRate = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    const startDate = getDateRange(timeRange);

    const totalOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate }
    });

    const returnedOrders = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: 'returned'
    });

    const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    res.json({
      success: true,
      data: { returnRate }
    });
  } catch (error) {
    console.error('Return Rate Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Lifetime Value
exports.lifetimeValue = async (req, res) => {
  try {
    const { organizationId, userId, displayCurrency } = req.query;
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $addFields: {
          numericTotal: {
            $cond: [
              { $eq: [{ $type: "$total" }, "string"] },
              { $toDouble: "$total" },
              "$total"
            ]
          },
          orderCurrency: {
            $ifNull: ["$currency", "USD"]
          }
        }
      },
      {
        $group: {
          _id: {
            customerId: '$customerId',
            currency: '$orderCurrency'
          },
          totalSpent: { $sum: "$numericTotal" }
        }
      },
      {
        $group: {
          _id: "$_id.customerId",
          spendingByCurrency: {
            $push: {
              currency: "$_id.currency",
              amount: "$totalSpent"
            }
          }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    
    // Convert each customer's spending to target currency
    let totalConvertedLTV = 0;
    const customerCount = result.length;

    for (const customer of result) {
      const convertedTotal = await currencyUtils.convertMultipleCurrencies(
        customer.spendingByCurrency,
        targetCurrency,
        organizationId
      );
      totalConvertedLTV += convertedTotal;
    }

    const averageLTV = customerCount > 0 ? totalConvertedLTV / customerCount : 0;

    res.json({
      success: true,
      data: { 
        lifetimeValue: averageLTV,
        currency: targetCurrency,
        customerCount
      }
    });
  } catch (error) {
    console.error('Lifetime Value Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Customer Acquisition
exports.customerAcquisition = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    
    const startDate = getDateRange(timeRange);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$created_via",
          customers: { $addToSet: "$customerId" }
        }
      },
      {
        $project: {
          source: "$_id",
          customers: { $size: "$customers" }
        }
      }
    ];

    const sources = await Order.aggregate(pipeline);
    
    const totalCustomers = sources.reduce((sum, source) => sum + source.customers, 0);

    const acquisitionData = sources.map(source => ({
      source: source.source || 'Direct',
      customers: source.customers,
      percentage: totalCustomers > 0 
        ? Math.round((source.customers / totalCustomers) * 100) 
        : 0
    }));

    res.json({
      success: true,
      data: { sources: acquisitionData }
    });
  } catch (error) {
    console.error('Customer Acquisition Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Product Performance
exports.productPerformance = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $unwind: "$line_items"
      },
      {
        $group: {
          _id: "$line_items.inventoryId",
          sales: { $sum: { $multiply: [{ $toDouble: "$line_items.subtotal" }, "$line_items.quantity"] } },
          quantity: { $sum: "$line_items.quantity" },
          currency: { $first: "$currency" }
        }
      },
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          name: "$product.name",
          sales: 1,
          quantity: 1,
          currency: 1,
          profit: { 
            $multiply: [
              "$quantity",
              { $subtract: [{ $toDouble: "$product.regular_price" }, { $toDouble: "$product.cost" }] }
            ]
          }
        }
      },
      {
        $sort: { sales: -1 }
      }
    ];

    const products = await Order.aggregate(pipeline);

    // Convert sales amounts to target currency
    const convertedProducts = await Promise.all(
      products.map(async (product) => {
        const convertedSales = await currencyUtils.convertCurrency(
          product.sales,
          product.currency || 'USD',
          targetCurrency,
          organizationId
        );
        
        return {
          ...product,
          sales: convertedSales,
          originalSales: product.sales,
          originalCurrency: product.currency,
          convertedCurrency: targetCurrency
        };
      })
    );

    res.json({
      success: true,
      data: { 
        products: convertedProducts,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Product Performance Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Funnel Data
exports.funnelData = async (req, res) => {
  try {
    const { timeRange, organizationId } = req.query;
    
    const startDate = getDateRange(timeRange);

    // Get site visits (placeholder)
    const siteVisits = 10000;

    // Get product views
    const productViewsPipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate }
        }
      },
      {
        $unwind: "$line_items"
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];

    const productViews = await Order.aggregate(productViewsPipeline);

    // Get cart additions
    const cartQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $ne: 'draft' }
    };

    const cartAdditions = await Order.countDocuments(cartQuery);

    // Get checkout starts
    const checkoutQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: { $nin: ['draft', 'cancelled'] }
    };

    const checkoutStarts = await Order.countDocuments(checkoutQuery);

    // Get completed purchases
    const purchaseQuery = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      date_created: { $gte: startDate },
      status: 'completed'
    };

    const completedPurchases = await Order.countDocuments(purchaseQuery);

    const funnelStages = [
      { stage: "Site Visit", count: siteVisits },
      { stage: "Product View", count: productViews[0]?.count || 0 },
      { stage: "Add to Cart", count: cartAdditions },
      { stage: "Checkout Start", count: checkoutStarts },
      { stage: "Purchase", count: completedPurchases }
    ];

    res.json({
      success: true,
      data: { stages: funnelStages }
    });
  } catch (error) {
    console.error('Funnel Data Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Retention Data
exports.retentionData = async (req, res) => {
  try {
    const { organizationId } = req.query;

    const pipeline = [
      {
        $match: {
          organizationId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          orderCount: 1,
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$daysSinceFirstOrder', 30] }, then: '30 days' },
                { case: { $lte: ['$daysSinceFirstOrder', 60] }, then: '60 days' },
                { case: { $lte: ['$daysSinceFirstOrder', 90] }, then: '90 days' }
              ],
              default: '90+ days'
            }
          },
          customerCount: { $sum: 1 },
          averageOrders: { $avg: '$orderCount' }
        }
      }
    ];

    const retentionData = await Order.aggregate(pipeline);

    res.json({
      success: true,
      data: { retentionData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Regional Sales
exports.regionalSales = async (req, res) => {
  try {
    const { timeRange, organizationId, userId, displayCurrency } = req.query;
    
    const startDate = getDateRange(timeRange);
    const targetCurrency = displayCurrency || await currencyUtils.getDisplayCurrency(userId, organizationId);

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date_created: { $gte: startDate },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $addFields: {
          numericTotal: { $toDouble: "$total" }
        }
      },
      {
        $group: {
          _id: "$shipping.country",
          sales: { $sum: "$numericTotal" },
          customers: { $addToSet: "$customerId" },
          currency: { $first: "$currency" }
        }
      },
      {
        $project: {
          region: { $ifNull: ["$_id", "Unknown"] },
          sales: 1,
          customers: { $size: "$customers" },
          currency: 1
        }
      },
      {
        $sort: { sales: -1 }
      }
    ];

    const regionalData = await Order.aggregate(pipeline);

    // Convert sales amounts to target currency
    const convertedRegionalData = await Promise.all(
      regionalData.map(async (region) => {
        const convertedSales = await currencyUtils.convertCurrency(
          region.sales,
          region.currency || 'USD',
          targetCurrency,
          organizationId
        );
        
        return {
          ...region,
          sales: convertedSales,
          originalSales: region.sales,
          originalCurrency: region.currency,
          convertedCurrency: targetCurrency
        };
      })
    );

    res.json({
      success: true,
      data: { 
        regionalData: convertedRegionalData,
        currency: targetCurrency
      }
    });
  } catch (error) {
    console.error('Regional Sales Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};