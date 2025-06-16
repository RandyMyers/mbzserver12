const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory');
const mongoose = require('mongoose');

// Helper: get date range for period
const getDateRange = (period) => {
  if (!period || period === 'all') return null;
  const now = new Date();
  switch (period) {
    case 'day': return [new Date(now.getFullYear(), now.getMonth(), now.getDate()), now];
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return [start, now];
    }
    case 'month': return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return [start, now];
    }
    case 'year': return [new Date(now.getFullYear(), 0, 1), now];
    default: return null;
  }
};

// Helper to build date filter
const buildDateFilter = (period) => {
  const range = getDateRange(period);
  if (!range) return {};
  return { date_created: { $gte: range[0], $lte: range[1] } };
};

// 1. Total Revenue by period
exports.totalRevenueByPeriod = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] },
        total: { $exists: true, $ne: "" }
      }},
      { $addFields: {
        numericTotal: {
          $cond: [
            { $eq: [{ $type: "$total" }, "string"] },
            { $toDouble: "$total" },
            "$total"
          ]
        }
      }},
      { $group: {
        _id: null,
        totalRevenue: { $sum: "$numericTotal" }
      }}
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: { totalRevenue: result[0]?.totalRevenue || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Revenue by Product
exports.revenueByProduct = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] }
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.inventoryId",
        sales: { $sum: { $multiply: ["$line_items.quantity", { $toDouble: "$line_items.subtotal" }] } },
        quantity: { $sum: "$line_items.quantity" }
      }},
      { $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        sales: 1,
        quantity: 1
      }},
      { $sort: { sales: -1 } }
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Order Status Distribution
exports.orderStatusDistribution = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter
      }},
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }}
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Improved New vs. Returning Customers
exports.newVsReturningCustomers = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);

    // Find all customers who placed orders in this period
    const ordersInPeriod = await Order.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: { $nin: ['cancelled', 'refunded'] }
    }).select('customerId date_created');

    const customerIdsInPeriod = [...new Set(ordersInPeriod.map(o => o.customerId?.toString()).filter(Boolean))];

    // Find first order date for each customer
    const firstOrders = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), customerId: { $in: customerIdsInPeriod.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$customerId", firstOrder: { $min: "$date_created" } } }
    ]);

    const periodRange = getDateRange(period);
    const periodStart = periodRange ? periodRange[0] : new Date(0);
    const periodEnd = periodRange ? periodRange[1] : new Date();

    let newCount = 0, returningCount = 0;
    for (const fo of firstOrders) {
      if (fo.firstOrder >= periodStart && fo.firstOrder <= periodEnd) {
        newCount++;
      } else {
        returningCount++;
      }
    }

    res.json({ success: true, data: { new: newCount, returning: returningCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Improved Acquisition Sources (unique customers)
exports.acquisitionSources = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);

    // Get unique customers and their first order in the period
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $sort: { date_created: 1 } },
      { $group: { _id: "$customerId", created_via: { $first: "$created_via" } } },
      { $group: { _id: "$created_via", customers: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);

    // Calculate percentages
    const total = result.reduce((sum, src) => sum + src.customers, 0);
    const sources = result.map(src => ({
      source: src._id || 'Direct',
      customers: src.customers,
      percentage: total > 0 ? Math.round((src.customers / total) * 100) : 0
    }));

    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Customer Lifetime Value (LTV)
exports.customerLifetimeValue = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $addFields: { numericTotal: { $cond: [ { $eq: [{ $type: "$total" }, "string"] }, { $toDouble: "$total" }, "$total" ] } } },
      { $group: { _id: "$customerId", totalSpent: { $sum: "$numericTotal" } } },
      { $group: { _id: null, averageLTV: { $avg: "$totalSpent" } } }
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: { lifetimeValue: result[0]?.averageLTV || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Repeat Purchase Rate
exports.repeatPurchaseRate = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    // Customers with more than 1 order in the period
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: "$customerId", orderCount: { $sum: 1 } } },
      { $group: { _id: null, repeaters: { $sum: { $cond: [ { $gt: ["$orderCount", 1] }, 1, 0 ] } }, total: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);
    const repeatRate = result[0] && result[0].total > 0 ? (result[0].repeaters / result[0].total) * 100 : 0;
    res.json({ success: true, data: { repeatPurchaseRate: repeatRate.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retention Cohort (simple: orders per month for last 6 months)
exports.retentionCohort = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }).reverse();
    const pipeline = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: { $nin: ['cancelled', 'refunded'] } } },
      { $project: { customerId: 1, year: { $year: "$date_created" }, month: { $month: "$date_created" } } },
      { $group: { _id: { customerId: "$customerId", year: "$year", month: "$month" }, count: { $sum: 1 } } }
    ];
    const result = await Order.aggregate(pipeline);
    // Build cohort table
    const cohorts = {};
    result.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!cohorts[key]) cohorts[key] = 0;
      cohorts[key] += r.count;
    });
    const cohortArr = months.map(m => ({ cohort: `${m.year}-${m.month}`, orders: cohorts[`${m.year}-${m.month}`] || 0 }));
    res.json({ success: true, data: cohortArr });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Improved Geographic Distribution (city, state, country, with fallbacks)
exports.geographicDistribution = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    // 1. Get all paying customers for the org
    const customers = await Customer.find({ organizationId, is_paying_customer: true });
    // 2. For each customer, get address (shipping > billing > most recent order)
    const addressMap = {};
    for (const customer of customers) {
      let address = null;
      if (customer.shipping && customer.shipping.city) {
        address = customer.shipping;
      } else if (customer.billing && customer.billing.city) {
        address = customer.billing;
      } else {
        // Fallback: get most recent order's address
        const order = await Order.findOne({ customerId: customer._id, organizationId: customer.organizationId, ...dateFilter })
          .sort({ date_created: -1 });
        if (order && order.shipping && order.shipping.city) {
          address = order.shipping;
        } else if (order && order.billing && order.billing.city) {
          address = order.billing;
        }
      }
      if (address) {
        addressMap[customer._id.toString()] = {
          city: address.city || 'Unknown',
          state: address.state || 'Unknown',
          country: address.country || 'Unknown'
        };
      }
    }
    // 3. Aggregate by city, state, country
    const regionCounts = {};
    Object.values(addressMap).forEach(addr => {
      const key = `${addr.city}|${addr.state}|${addr.country}`;
      if (!regionCounts[key]) regionCounts[key] = { city: addr.city, state: addr.state, country: addr.country, customers: 0 };
      regionCounts[key].customers++;
    });
    const result = Object.values(regionCounts).sort((a, b) => b.customers - a.customers);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 7. Low Stock
exports.lowStock = async (req, res) => {
  try {
    const { organizationId, threshold = 10 } = req.query;
    const products = await Inventory.find({
      organizationId,
      stock_quantity: { $lte: Number(threshold) },
      status: 'publish'
    }).select('name stock_quantity');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 8. Abandoned Cart Rate
exports.abandonedCartRate = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const totalCarts = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: { $in: ['draft', 'pending', 'completed'] }
    });
    const completed = await Order.countDocuments({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      ...dateFilter,
      status: 'completed'
    });
    const abandoned = totalCarts - completed;
    const rate = totalCarts > 0 ? (abandoned / totalCarts) * 100 : 0;
    res.json({ success: true, data: { abandoned, totalCarts, rate: rate.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. Best Sellers
exports.bestSellers = async (req, res) => {
  try {
    const { organizationId, period } = req.query;
    const dateFilter = buildDateFilter(period);
    const pipeline = [
      { $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        ...dateFilter,
        status: { $nin: ['cancelled', 'refunded'] }
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.inventoryId",
        quantity: { $sum: "$line_items.quantity" },
        sales: { $sum: { $multiply: ["$line_items.quantity", { $toDouble: "$line_items.subtotal" }] } }
      }},
      { $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }},
      { $unwind: "$product" },
      { $project: {
        name: "$product.name",
        sales: 1,
        quantity: 1
      }},
      { $sort: { quantity: -1 } }
    ];
    const result = await Order.aggregate(pipeline);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ... Add more analytics as needed ... 