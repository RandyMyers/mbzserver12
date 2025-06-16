const express = require('express');
const router = express.Router();
const analytics = require('../controllers/advancedAnalyticsController');

// Sales Analytics
router.get('/sales/total-revenue', analytics.totalRevenueByPeriod);
router.get('/sales/revenue-by-product', analytics.revenueByProduct);
router.get('/sales/order-status-distribution', analytics.orderStatusDistribution);

// Customer Analytics
router.get('/customers/new-vs-returning', analytics.newVsReturningCustomers);
router.get('/customers/acquisition-sources', analytics.acquisitionSources);

// Product Performance
router.get('/products/best-sellers', analytics.bestSellers);
router.get('/products/low-stock', analytics.lowStock);

// Order Funnel
router.get('/funnel/abandoned-cart-rate', analytics.abandonedCartRate);

// ... Add more analytics endpoints as needed ...

module.exports = router; 