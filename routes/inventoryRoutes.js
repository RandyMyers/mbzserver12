const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryControllers");

// CREATE a new product
router.post("/create", inventoryController.createProduct);

// GET all products for a specific organization
router.get("/organization/:organizationId", inventoryController.getAllProductsByOrganization);

// GET a specific product by Store
router.get("/store/:storeId", inventoryController.getAllProductsByStore);

// GET all Products
router.get("/all", inventoryController.getProductById);

// GET a specific product by ID
router.get("/get/:productId", inventoryController.getProductById);

// UPDATE a product by ID
router.patch("/update/:productId", inventoryController.updateProduct);

// DELETE a product by ID
router.delete("/delete/:productId", inventoryController.deleteProduct);

// DELETE all products for a specific store
router.delete("/deleteAll/:storeId", inventoryController.deleteAllProductsByStore);

// Synchronize products with WooCommerce API
router.post("/sync/:storeId/:organizationId", inventoryController.syncProducts);

module.exports = router;
