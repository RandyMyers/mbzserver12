const { parentPort, workerData } = require('worker_threads');
const Order = require('../models/order');
const Customer = require('../models/customers');
const Inventory = require('../models/inventory'); // Import Inventory model
const connectDB = require('./connectDB');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

// Get the customerId if customer exists, otherwise return null
const getCustomerIdByWooCommerceId = async (woocommerceCustomerId, email, organizationId, storeId) => {
    const customer = await Customer.findOne({
      $and: [
        { organizationId },
        { storeId },
        { $or: [{ customer_Id: woocommerceCustomerId }, { email }] },
      ],
    });
    return customer ? customer._id : null; // Return null if customer not found
  };
  
  const getInventoryIdByProductId = async (productId, sku, organizationId, storeId) => {
    const inventory = await Inventory.findOne({
      $and: [
        { organizationId },
        { storeId },
        { $or: [{ product_Id: productId }, { sku }] },
      ],
    });
    return inventory ? inventory._id : null; // Return null if inventory not found
  };

const syncOrderJob = async (jobData) => {
  try {
    const { storeId, store, organizationId, userId } = workerData;
    connectDB();

    const wooCommerce = new WooCommerceRestApi({
      url: store._doc.url,
      consumerKey: store._doc.apiKey,
      consumerSecret: store._doc.secretKey,
      version: 'wc/v3',
    });

    const getAllOrders = async (page = 1) => {
      const response = await wooCommerce.get('orders', { per_page: 100, page });
      return response.data;
    };

    let orders = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageOrders = await getAllOrders(page);
      if (currentPageOrders.length === 0) hasMore = false;
      else {
        orders = [...orders, ...currentPageOrders];
        page++;
      }
    }

    for (const order of orders) {
        const existingOrder = await Order.findOne({ order_id: order.id.toString(), storeId });
        const customerId = await getCustomerIdByWooCommerceId(
          order.customer_id,
          order.billing.email,
          organizationId,
          storeId
        );
      
        // Process line items to fetch inventory IDs
        const lineItems = await Promise.all(
          order.line_items.map(async (item) => {
            const inventoryId = await getInventoryIdByProductId(
              item.product_id,
              item.sku,
              organizationId,
              storeId
            );
            return {
              ...item,
              inventoryId, // Add inventoryId to line item
            };
          })
        );

      const orderData = {
        storeId,
        organizationId,
        userId,
        customerId,
        customer_Id: order.customer_id,
        billing: order.billing,
        shipping: order.shipping,
        order_id: order.id.toString(),
        number: order.number,
        status: order.status,
        currency: order.currency,
        version: order.version,
        prices_include_tax: order.prices_include_tax,
        date_created: new Date(order.date_created),
        date_modified: new Date(order.date_modified),
        discount_total: order.discount_total,
        discount_tax: order.discount_tax,
        shipping_total: order.shipping_total,
        shipping_tax: order.shipping_tax,
        cart_tax: order.cart_tax,
        total: order.total,
        total_tax: order.total_tax,
        customer_note: order.customer_note,
        payment_method: order.payment_method,
        payment_method_title: order.payment_method_title,
        transaction_id: order.transaction_id,
        customer_ip_address: order.customer_ip_address,
        customer_user_agent: order.customer_user_agent,
        created_via: order.created_via,
        date_completed: order.date_completed,
        date_paid: order.date_paid,
        cart_hash: order.cart_hash,
        meta_data: order.meta_data,
        line_items: lineItems, // Updated line items with inventory IDs
        shipping_lines: order.shipping_lines,
        fee_lines: order.fee_lines,
        coupon_lines: order.coupon_lines,
        refunds: order.refunds,
        payment_url: order.payment_url,
        is_editable: order.is_editable,
        needs_payment: order.needs_payment,
        needs_processing: order.needs_processing,
        date_created_gmt: order.date_created_gmt,
        date_modified_gmt: order.date_modified_gmt,
        date_completed_gmt: order.date_completed_gmt,
        date_paid_gmt: order.date_paid_gmt,
        currency_symbol: order.currency_symbol,
        _links: order._links,
      };

      if (existingOrder) {
        await Order.findOneAndUpdate(
          { order_id: order.id.toString(), storeId },
          { $set: orderData },
          { new: true }
        );
      } else {
        await Order.create(orderData);
      }
    }

    parentPort.postMessage({ status: 'success', message: 'Orders synchronized successfully' });
  } catch (error) {
    parentPort.postMessage({ status: 'error', message: error.message });
  }
};

syncOrderJob(workerData);
