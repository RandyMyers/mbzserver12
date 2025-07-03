const express = require('express');
const router = express.Router();
const userPreferencesController = require('../controllers/userPreferencesController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get user preferences
router.get('/', userPreferencesController.getUserPreferences);

// Update user display currency
router.put('/display-currency', userPreferencesController.updateDisplayCurrency);

// Update organization analytics currency
router.put('/analytics-currency', userPreferencesController.updateAnalyticsCurrency);

// Get currency conversion preview
router.get('/currency-conversion', userPreferencesController.getCurrencyConversionPreview);

// Get currency statistics
router.get('/currency-stats', userPreferencesController.getCurrencyStats);

// Get available currencies
router.get('/available-currencies', userPreferencesController.getAvailableCurrencies);

module.exports = router; 