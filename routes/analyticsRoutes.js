const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analysisControllers');
const emailLogsController = require('../controllers/emailLogsController');

// Route for Total Revenue
router.get('/total-revenue', analyticsController.totalRevenue);

// Route for Total Orders
router.get('/total-orders', analyticsController.totalOrders);

// Route for New Customers
router.get('/new-customers', analyticsController.newCustomers);

// Route for Average Order Value
router.get('/average-order-value', analyticsController.averageOrderValue);

// Route for Return Rate
router.get('/return-rate', analyticsController.returnRate);

// Route for Lifetime Value (LTV)
router.get('/lifetime-value', analyticsController.lifetimeValue);

// Route for Customer Acquisition by Source
router.get('/customer-acquisition', analyticsController.customerAcquisition);

// Route for Product Performance
router.get('/product-performance', analyticsController.productPerformance);

// Route for Funnel Data
router.get('/funnel-data', analyticsController.funnelData);

// Route for Retention Data
router.get('/retention-data', analyticsController.retentionData);

// Route for Regional Sales
router.get('/regional-sales', analyticsController.regionalSales);

// Email Analytics
router.get('/email/delivery-stats', emailLogsController.getDeliveryStats);
router.get('/email/device-stats', emailLogsController.getDeviceStats);
router.get('/email/geo-stats', emailLogsController.getGeoStats);

module.exports = router;