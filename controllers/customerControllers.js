const Customer = require('../models/customers'); // Adjust the path as per your project structure
const { Worker } = require('worker_threads');
const path = require('path');
const Store = require('../models/store');
const Organization = require('../models/organization');

exports.syncCustomers = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    const worker = new Worker(path.resolve(__dirname, '../helper/syncCustomerWorker.js'), {
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

    res.json({ message: 'Customer synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncCustomers:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
    try {
      const {
        storeId,
        userId,
        organizationId,
        customer_id,
        customer_ip_address,
        date_created,
        date_created_gmt,
        date_modified,
        date_modified_gmt,
        email,
        first_name,
        last_name,
        role,
        username,
        billing,
        shipping,
        is_paying_customer,
        avatar_url,
        meta_data,
        _links,
      } = req.body;
  
      // Validate required fields
      if (!storeId || !userId || !organizationId || !customer_id) {
        return res.status(400).json({ message: 'Missing required fields.' });
      }
  
      // Create a new customer
      const newCustomer = new Customer({
        storeId,
        userId,
        organizationId,
        customer_id,
        customer_ip_address,
        date_created,
        date_created_gmt,
        date_modified,
        date_modified_gmt,
        email,
        first_name,
        last_name,
        role,
        username,
        billing,
        shipping,
        is_paying_customer,
        avatar_url,
        meta_data,
        _links,
      });
  
      const savedCustomer = await newCustomer.save();
      res.status(201).json({ message: 'Customer created successfully.', data: savedCustomer });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Error creating customer.', error });
    }
  };

  exports.getCustomersByOrganizationId = async (req, res) => {
    try {
      const { organizationId } = req.params;
  
      // Fetch customers by organizationId and populate related fields
      const customers = await Customer.find({ organizationId })
        .populate('storeId', 'name') // Adjust fields to match Store schema
        .populate('userId', 'name email') // Adjust fields to match User schema
        .populate('organizationId', 'name'); // Adjust fields to match Organization schema
  
      if (customers.length === 0) {
        return res.status(404).json({ message: 'No customers found for this organization.' });
      }
  
      res.status(200).json({
        message: 'Customers retrieved successfully for the organization.',
        customers,
      });
    } catch (error) {
      console.error('Error retrieving customers by organization ID:', error);
      res.status(500).json({
        message: 'Error retrieving customers by organization ID.',
        error: error.message,
      });
    }
  }

  exports.getAllCustomers = async (req, res) => {
    try {
      const customers = await Customer.find()
        .populate('storeId', 'name') // Adjust fields to populate as per your Store schema
        .populate('userId', 'name email') // Adjust fields to populate as per your User schema
        .populate('organizationId', 'name'); // Adjust fields to populate as per your Organization schema
  
      res.status(200).json({ message: 'Customers retrieved successfully.', data: customers });
    } catch (error) {
      console.error('Error retrieving customers:', error);
      res.status(500).json({ message: 'Error retrieving customers.', error });
    }
  };

  exports.getCustomerById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const customer = await Customer.findById(id)
        .populate('storeId', 'name')
        .populate('userId', 'name email')
        .populate('organizationId', 'name');
  
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
  
      res.status(200).json({ message: 'Customer retrieved successfully.', data: customer });
    } catch (error) {
      console.error('Error retrieving customer:', error);
      res.status(500).json({ message: 'Error retrieving customer.', error });
    }
  };

  exports.updateCustomer = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const updatedCustomer = await Customer.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
  
      if (!updatedCustomer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
  
      res.status(200).json({ message: 'Customer updated successfully.', data: updatedCustomer });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Error updating customer.', error });
    }
  };

  exports.deleteCustomer = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedCustomer = await Customer.findByIdAndDelete(id);
  
      if (!deletedCustomer) {
        return res.status(404).json({ message: 'Customer not found.' });
      }
  
      res.status(200).json({ message: 'Customer deleted successfully.', data: deletedCustomer });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Error deleting customer.', error });
    }
  };

  exports.getCustomersByStoreId = async (req, res) => {
    try {
      const { storeId } = req.params;
  
      const customers = await Customer.find({ storeId }).populate('userId', 'name email');
  
      res.status(200).json({ message: 'Customers retrieved successfully for the store.', data: customers });
    } catch (error) {
      console.error('Error retrieving customers by store ID:', error);
      res.status(500).json({ message: 'Error retrieving customers by store ID.', error });
    }
  };
  

  