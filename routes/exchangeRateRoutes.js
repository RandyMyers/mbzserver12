const express = require('express');
const router = express.Router();
const exchangeRateController = require('../controllers/exchangeRateController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get all exchange rates for an organization
router.get('/', exchangeRateController.getExchangeRates);

// Convert currency (must come before /:id route)
router.get('/convert', exchangeRateController.convertCurrency);

// Get a specific exchange rate
router.get('/:id', exchangeRateController.getExchangeRate);

// Create a new exchange rate
router.post('/', exchangeRateController.createExchangeRate);

// Bulk create exchange rates
router.post('/bulk', exchangeRateController.bulkCreateExchangeRates);

// Update an exchange rate
router.put('/:id', exchangeRateController.updateExchangeRate);

// Delete an exchange rate
router.delete('/:id', exchangeRateController.deleteExchangeRate);

module.exports = router;