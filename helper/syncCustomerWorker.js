const { parentPort, workerData } = require('worker_threads');
const Customer = require('../models/customers');
const connectDB = require('./connectDB');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const syncCustomerJob = async (jobData) => {
  try {
    const { storeId, store, organizationId, userId } = workerData;

    // Connect to MongoDB
    connectDB();

    const wooCommerce = new WooCommerceRestApi({
      url: store._doc.url,
      consumerKey: store._doc.apiKey,
      consumerSecret: store._doc.secretKey,
      version: 'wc/v3',
    });

    const getAllCustomers = async (page = 1) => {
      const response = await wooCommerce.get('customers', { per_page: 100, page });
      return response.data;
    };

    let customers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const currentPageCustomers = await getAllCustomers(page);
      if (currentPageCustomers.length === 0) hasMore = false;
      else {
        customers = [...customers, ...currentPageCustomers];
        page++;
      }
    }

    for (const customer of customers) {
      const existingCustomer = await Customer.findOne({
        customer_id: customer.id.toString(),
        storeId,
      });

      const customerData = {
        storeId,
        organizationId,
        userId,
        customer_id: customer.id.toString(),
        date_created: new Date(customer.date_created),
        date_created_gmt: new Date(customer.date_created_gmt),
        date_modified: new Date(customer.date_modified),
        date_modified_gmt: new Date(customer.date_modified_gmt),
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        role: customer.role,
        username: customer.username,
        billing: customer.billing,
        shipping: customer.shipping,
        is_paying_customer: customer.is_paying_customer,
        avatar_url: customer.avatar_url,
        meta_data: customer.meta_data,
        _links: customer._links,
      };

      if (existingCustomer) {
        await Customer.findOneAndUpdate(
          { customer_id: customer.id.toString(), storeId },
          { $set: customerData },
          { new: true }
        );
      } else {
        await Customer.create(customerData);
      }
    }

    parentPort.postMessage({ status: 'success', message: 'Customers synchronized successfully' });
  } catch (error) {
    parentPort.postMessage({ status: 'error', message: error.message });
  }
};

syncCustomerJob(workerData);
