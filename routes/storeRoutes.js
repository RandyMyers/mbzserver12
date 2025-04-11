const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeControllers");

// CREATE a new store
router.post("/create", storeController.createStore);

// GET all stores by organization
router.get("/organization/:organizationId", storeController.getStoresByOrganization);

// GET a specific store by ID
router.get("/get/:storeId", storeController.getStoreById);

// UPDATE a store by ID
router.patch("/update/:storeId", storeController.updateStore);

// DELETE a store by ID
router.delete("/delete/:storeId", storeController.deleteStore);

// Sync store with WooCommerce
router.patch("/sync/:storeId", storeController.syncStoreWithWooCommerce);

module.exports = router;
