const express = require("express");
const router = express.Router();
const productController = require("../controllers/productControllers");

// Routes
router.post("/create", productController.createProduct); // Create a new product
router.get("/all", productController.getAllProducts); // Get all products
router.get("/get/:id", productController.getProductById); // Get product by ID
router.patch("/update/:id", productController.updateProduct); // Update a product
router.delete("/delete/:id", productController.deleteProduct); // Delete a product
router.post("/add-subscription", productController.addSubscriptionPlanToProduct); // Add subscription plan to product

module.exports = router;
