const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderControllers");

// CREATE a new order
router.post("/create", orderController.createOrder);

// GET all orders for a specific organization
router.get("/all", orderController.getAllOrders);

// GET all orders for a specific organization
router.get("/organization/:organizationId", orderController.getAllOrdersByOrganization);

// GET all orders for a specific store
router.get("/store/:storeId", orderController.getOrdersByStoreId);

// GET a specific order by ID
router.get("/get/:orderId", orderController.getOrderById);

// UPDATE a specific order by ID
router.patch("/update/:orderId", orderController.updateOrder);

// DELETE an order by ID
router.delete("/delete/:orderId", orderController.deleteOrder);

// SYNC orders for a specific store and organization
router.post("/sync/:storeId/:organizationId", orderController.syncOrders);

module.exports = router;
