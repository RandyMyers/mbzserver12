const Product = require('../models/product'); // Import Product model
const SubscriptionPlan = require('../models/subscriptionPlans'); // Import SubscriptionPlan model (assuming it exists)


  // Create a new product
  exports.createProduct = async (req, res) => {
    try {
      const { name, description, isActive } = req.body;

      console.log(req.body);

      // Check if product already exists
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({ message: "Product already exists" });
      }

      const newProduct = new Product({
        name,
        description,
        isActive
      });

      await newProduct.save();
      res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Get all products
  exports.getAllProducts = async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Get product by ID
  exports.getProductById = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Update a product
  exports.updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Update product fields
      product.name = name || product.name;
      product.description = description || product.description;
      product.isActive = isActive !== undefined ? isActive : product.isActive;
      product.updatedAt = Date.now();

      await product.save();
      res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Delete a product
  exports.deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.remove();
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Add subscription plan to product
  exports.addSubscriptionPlanToProduct = async (req, res) => {
    try {
      const { productId, subscriptionPlanId } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
      if (!subscriptionPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Add the subscription plan to the product's subscriptionPlans array
      product.subscriptionPlans.push(subscriptionPlanId);
      await product.save();

      res.status(200).json({ message: "Subscription plan added to product", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

