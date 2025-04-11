const Inventory = require('../models/inventory');
const Store = require('../models/store');
const Organization = require('../models/organization');
const mongoose = require('mongoose');
const { Worker } = require('worker_threads');
const path = require('path');

//const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;



// Synchronize products with WooCommerce API
exports.syncProducts = async (req, res) => {
  try {
    const { storeId, organizationId } = req.params;
    const { userId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ error: 'Organization not found' });

    const worker = new Worker(path.resolve(__dirname, '../helper/syncProductWorker.js'), {
      workerData: { storeId, store, organizationId, userId },
    });

    console.log('Worker Path:', path.resolve(__dirname, '../helper/syncProductWorker.js'));


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

    res.json({ message: 'Product synchronization started in the background' });
  } catch (error) {
    console.error('Error in syncProducts:', error.message);
    res.status(500).json({ error: error.message });
  }
};
  
// CREATE a new product in the inventory
exports.createProduct = async (req, res) => {
  try {
    const {
      id,
      sku,
      name,
      description,
      price,
      sale_price,
      regular_price,
      status,
      featured,
      stock,
      manage_stock,
      stock_quantity,
      stock_status,
      shipping_required,
      shipping_class,
      shipping_class_id,
      categories,
      tags,
      images,
      average_rating,
      rating_count,
      dimensions,
      permalink,
      slug,
      date_created,
      date_modified,
      type,
      upsell_ids,
      cross_sell_ids,
      related_ids,
      storeId,
      userId,
      organizationId,
    } = req.body;

    const newProduct = new Inventory({
      id,
      sku,
      name,
      description,
      price,
      sale_price,
      regular_price,
      status,
      featured,
      stock,
      manage_stock,
      stock_quantity,
      stock_status,
      shipping_required,
      shipping_class,
      shipping_class_id,
      categories,
      tags,
      images,
      average_rating,
      rating_count,
      dimensions,
      permalink,
      slug,
      date_created,
      date_modified,
      type,
      upsell_ids,
      cross_sell_ids,
      related_ids,
      storeId,
      userId,
      organizationId,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
};

// GET all products for a specific organization
exports.getAllProductsByOrganization = async (req, res) => {
  const { organizationId } = req.params;
  try {
    const products = await Inventory.find({ organizationId })
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

// GET all products for a specific store
exports.getAllProductsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const products = await Inventory.find({ storeId })
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

// GET all products in the system
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Inventory.find()
      .populate("storeId userId organizationId", "name") // Populate relevant fields
      .exec();
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

// GET a specific product by its ID
exports.getProductById = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Inventory.findById(productId)
      .populate("storeId userId organizationId", "name")
      .exec();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve product" });
  }
};

// UPDATE product details (e.g., price, description, stock quantity)
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const updateData = req.body;

  try {
    const updatedProduct = await Inventory.findByIdAndUpdate(
      productId,
      { $set: updateData, updatedAt: Date.now() },
      { new: true } // return the updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

// DELETE a product from the inventory
exports.deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const deletedProduct = await Inventory.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// DELETE all products for a specific store
exports.deleteAllProductsByStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const result = await Inventory.deleteMany({ storeId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "No products found for this store" });
    }
    res.status(200).json({ success: true, message: "All products deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete products" });
  }
};

