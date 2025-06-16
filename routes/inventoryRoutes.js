const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryControllers");

// Product CRUD Operations
router.post("/create", inventoryController.createProduct);
router.get("/organization/:organizationId", inventoryController.getAllProductsByOrganization);
router.get("/store/:storeId", inventoryController.getAllProductsByStore);
router.get("/all", inventoryController.getAllProducts); // Fixed this route (was incorrectly pointing to getProductById)
router.get("/get/:productId", inventoryController.getProductById);
router.patch("/update/:productId", inventoryController.updateProduct);
router.delete("/delete/:productId", inventoryController.deleteProduct);
router.delete("/deleteAll/:storeId", inventoryController.deleteAllProductsByStore);

// Product Synchronization
router.post("/sync/:storeId/:organizationId", inventoryController.syncProducts);

// Updated Inventory Metrics Endpoints
router.get("/metrics/total-products/:organizationId", inventoryController.getTotalProducts);
router.get("/metrics/in-stock/:organizationId", inventoryController.getInStockItems);
router.get("/metrics/low-stock/:organizationId", inventoryController.getLowStockItems);
router.get("/metrics/out-of-stock/:organizationId", inventoryController.getOutOfStockItems);
router.get("/metrics/category-count/:organizationId", inventoryController.getCategoryCount);
router.get("/metrics/store-count/:organizationId", inventoryController.getStoreCount);
router.get("/metrics/total-value/:organizationId", inventoryController.getTotalInventoryValue);
router.get("/metrics/avg-price/:organizationId", inventoryController.getAveragePrice);
router.get("/metrics/on-sale/:organizationId", inventoryController.getOnSaleCount);
router.get("/metrics/avg-rating/:organizationId", inventoryController.getAverageRating);
module.exports = router;