const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');
const Order = require('../models/order');
const mongoose = require('mongoose');
const logEvent = require('../helper/logEvent');

exports.syncOrders = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    const worker = new Worker(path.resolve(__dirname, '../helper/syncOrderWorker.js'), {
      workerData: { storeId, store, organizationId, userId },
    });

    worker.on('message', (message) => {
      if (message.status === 'success') {
        console.log(message.message);
      } else if (message.status === 'error') {
        console.error(`Error in worker thread: ${message.message}`);
      }
    });

    worker.on('error', (error) => {
      console.error(`Worker thread error: ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    });

    res.json({ message: 'Order synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncOrders:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// CREATE a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      storeId,
      userId,
      organizationId,
      customer_id,
      billing,
      shipping,
      order_id,
      number,
      status,
      currency,
      date_created,
      total,
      customer_note,
      line_items,
      shipping_lines
    } = req.body;

    const newOrder = new Order({
      storeId,
      userId,
      organizationId,
      customer_id,
      billing,
      shipping,
      order_id,
      number,
      status,
      currency,
      date_created,
      total,
      customer_note,
      line_items,
      shipping_lines
    });

    const savedOrder = await newOrder.save();
    await logEvent({
      action: 'create_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: savedOrder._id,
      details: { ...savedOrder.toObject() },
      organization: req.user.organization
    });
    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// GET all orders for a specific organization
exports.getAllOrders = async (req, res) => {
  
  try {
    const orders = await Order.find()
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

exports.getAllOrdersByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const orders = await Order.find({ organizationId })
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

// GET a specific order by its ID
exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId)
      .populate("storeId userId organizationId customer_id", "name email") // Populate store, user, organization, and customer
      .populate("line_items.inventoryId", "product_Id sku name images") // Populate inventoryId in line_items
      .exec();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve order" });
  }
};

// GET all orders for a specific store ID
exports.getOrdersByStoreId = async (req, res) => {
  const { storeId } = req.params;
  try {
    const orders = await Order.find({ storeId })
      .populate("storeId userId organizationId customer_id", "name email") // Populate relevant fields
      .exec();

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this store" });
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders by store ID:', error);
    res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
}

// UPDATE order details (e.g., status, customer_note)
exports.updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData, updatedAt: Date.now() },
      { new: true } // return the updated order
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await logEvent({
      action: 'update_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: updatedOrder._id,
      details: { before: updatedOrder.toObject(), after: updatedOrder },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

// DELETE an order from the system
exports.deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};

// Helper function for date filtering - moved to top
function getDateFilter(timeRange) {
  const now = new Date();
  let startDate;
  
  switch(timeRange) {
    case '7d':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30d':
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '90d':
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    case '1y':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  return { $gte: startDate };
}

// 1. Cross-Store Performance Analytics (without time range filter)
exports.getCrossStorePerformance = async (req, res) => {
  try {
    const { organizationId } = req.params;
  
    const result = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId)
        // Removed the date_created filter
      }},
      { $group: {
        _id: "$storeId",
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: { $toDouble: "$total" } },
        avgOrderValue: { $avg: { $toDouble: "$total" } },
        statusCounts: { $push: "$status" }
      }},
      { $project: {
        storeId: "$_id",
        orderCount: 1,
        totalRevenue: 1,
        avgOrderValue: 1,
        statusDistribution: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: "$statusCounts" },
              as: "status",
              in: { 
                k: "$$status", 
                v: { 
                  $size: { 
                    $filter: { 
                      input: "$statusCounts", 
                      as: "s", 
                      cond: { $eq: ["$$s", "$$status"] } 
                    } 
                  } 
                } 
              }
            }
          }
        }
      }}
    ]);

    res.json({
      summary: {
        totalOrders: result.reduce((sum, store) => sum + store.orderCount, 0),
        totalRevenue: result.reduce((sum, store) => sum + store.totalRevenue, 0),
        avgOrderValue: result.reduce((sum, store) => sum + store.avgOrderValue, 0) / (result.length || 1) // Added protection against division by zero
      },
      stores: result
    });
  } catch (error) {
    console.error('Error in getCrossStorePerformance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Temporal Analytics
exports.getTemporalAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    
    // Daily trends
    const daily = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date_created" } },
        orders: { $sum: 1 },
        revenue: { $sum: { $toDouble: "$total" } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Hourly patterns
    const hourly = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $group: {
        _id: { $hour: "$date_created" },
        orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ dailyTrends: daily, hourlyPatterns: hourly });
  } catch (error) {
    console.error('Error in getTemporalAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Customer Insights
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$customer_id",
        totalSpent: { $sum: { $toDouble: "$total" } },
        orderCount: { $sum: 1 },
        firstOrderDate: { $min: "$date_created" },
        lastOrderDate: { $max: "$date_created" },
        storesUsed: { $addToSet: "$storeId" }
      }},
      { $project: {
        customerId: "$_id",
        totalSpent: 1,
        orderCount: 1,
        storesUsed: 1,
        avgDaysBetweenOrders: {
          $divide: [
            { $divide: [
              { $subtract: ["$lastOrderDate", "$firstOrderDate"] },
              1000 * 60 * 60 * 24
            ]},
            { $max: [1, { $subtract: ["$orderCount", 1] }] }
          ]
        }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Product Performance
exports.getProductPerformance = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { timeRange = '30d' } = req.query;
    const dateFilter = getDateFilter(timeRange);
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_created: dateFilter 
      }},
      { $unwind: "$line_items" },
      { $group: {
        _id: "$line_items.product_id",
        name: { $first: "$line_items.name" },
        totalSold: { $sum: "$line_items.quantity" },
        totalRevenue: { $sum: { $multiply: [
          { $toDouble: "$line_items.price" },
          "$line_items.quantity"
        ]}},
        storesSoldIn: { $addToSet: "$storeId" }
      }},
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getProductPerformance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 5. Financial Analytics
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const result = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $toDouble: "$total" } },
        totalTax: { $sum: { $toDouble: "$total_tax" } },
        totalShipping: { $sum: { $toDouble: "$shipping_total" } },
        totalDiscounts: { $sum: { $toDouble: "$discount_total" } },
        paymentMethods: { $push: "$payment_method" }
      }}
    ]);

    const paymentMethodDistribution = result[0]?.paymentMethods?.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      ...result[0],
      paymentMethodDistribution,
      discountEffectiveness: result[0]?.totalDiscounts > 0 ? 
        (result[0].totalDiscounts / result[0].totalRevenue) * 100 : 0
    });
  } catch (error) {
    console.error('Error in getFinancialAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 6. Operational Metrics
exports.getOperationalMetrics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date_completed: { $exists: true },
        date_created: { $exists: true }
      }},
      { $project: {
        storeId: 1,
        processingTime: {
          $divide: [
            { $subtract: ["$date_completed", "$date_created"] },
            1000 * 60 * 60 // Convert to hours
          ]
        }
      }},
      { $group: {
        _id: "$storeId",
        avgProcessingTime: { $avg: "$processingTime" }
      }}
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getOperationalMetrics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 7. Geospatial Analysis
exports.getGeospatialAnalytics = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { 
        organizationId: new mongoose.Types.ObjectId(organizationId),
        "shipping.country": { $exists: true }
      }},
      { $group: {
        _id: "$shipping.country",
        orderCount: { $sum: 1 },
        avgShippingCost: { $avg: { $toDouble: "$shipping_total" } }
      }},
      { $sort: { orderCount: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getGeospatialAnalytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// 8. Status Distribution Analytics
exports.getStatusDistribution = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }},
      { $project: {
        status: "$_id",
        count: 1,
        _id: 0
      }}
    ]);

    res.json(data);
  } catch (error) {
    console.error('Error in getStatusDistribution:', error);
    res.status(500).json({ error: error.message });
  }
};

// 9. Sales Funnel Analysis
exports.getSalesFunnel = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $facet: {
        totalVisitors: [
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        initiatedCheckout: [
          { $match: { status: { $in: ['pending', 'processing', 'on-hold'] } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        completedPurchases: [
          { $match: { status: 'completed' } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }},
      { $project: {
        totalVisitors: { $arrayElemAt: ["$totalVisitors.count", 0] },
        initiatedCheckout: { $arrayElemAt: ["$initiatedCheckout.count", 0] },
        completedPurchases: { $arrayElemAt: ["$completedPurchases.count", 0] }
      }}
    ]);

    res.json(data[0]);
  } catch (error) {
    console.error('Error in getSalesFunnel:', error);
    res.status(500).json({ error: error.message });
  }
};

// 10. Customer Lifetime Value
exports.getCustomerLTV = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const data = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: {
        _id: "$customer_id",
        totalSpent: { $sum: { $toDouble: "$total" } },
        firstPurchase: { $min: "$date_created" },
        lastPurchase: { $max: "$date_created" }
      }},
      { $group: {
        _id: null,
        avgLTV: { $avg: "$totalSpent" },
        medianLTV: { 
          $median: {
            input: "$totalSpent",
            method: 'approximate'
          }
        },
        avgCustomerLifespan: {
          $avg: {
            $divide: [
              { $subtract: ["$lastPurchase", "$firstPurchase"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      }}
    ]);

    res.json(data[0]);
  } catch (error) {
    console.error('Error in getCustomerLTV:', error);
    res.status(500).json({ error: error.message });
  }
};

// In cancelOrder (after cancelling the order)
exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = 'cancelled';
    await order.save();

    await logEvent({
      action: 'cancel_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: order._id,
      details: { ...order.toObject() },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

// In refundOrder (after refunding the order)
exports.refundOrder = async (req, res) => {
  const { orderId, refundAmount, reason } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = 'refunded';
    order.refund_amount = refundAmount;
    order.refund_reason = reason;
    await order.save();

    await logEvent({
      action: 'refund_order',
      user: req.user._id,
      resource: 'Order',
      resourceId: order._id,
      details: { refundAmount, reason },
      organization: req.user.organization
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to refund order" });
  }
};

// GET recent orders for dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const { organizationId, limit = 5 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "Organization ID is required" 
      });
    }

    const orders = await Order.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    })
    .populate("customer_id", "first_name last_name email")
    .populate("line_items.inventoryId", "name images")
    .sort({ date_created: -1 })
    .limit(parseInt(limit))
    .exec();

    // Format orders for dashboard display
    const formattedOrders = orders.map(order => ({
      id: order.order_id || order._id,
      customer: order.customer_id ? 
        `${order.customer_id.first_name || ''} ${order.customer_id.last_name || ''}`.trim() || 
        order.customer_id.email : 
        'Unknown Customer',
      product: order.line_items && order.line_items.length > 0 ? 
        order.line_items[0].inventoryId?.name || 'Unknown Product' : 
        'No Products',
      status: order.status,
      amount: order.total ? `$${parseFloat(order.total).toFixed(2)}` : '$0.00',
      date: order.date_created ? new Date(order.date_created).toISOString().split('T')[0] : 'Unknown Date'
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Get Recent Orders Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent orders"
    });
  }
};
