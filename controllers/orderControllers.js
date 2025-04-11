const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');
const Order = require('../models/order');

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
