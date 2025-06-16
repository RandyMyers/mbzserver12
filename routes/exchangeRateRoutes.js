const express = require('express');
const router = express.Router();
const exchangeRateController = require('../controllers/exchangeRateControllers');

// Set or Update Exchange Rate
router.post('/set', exchangeRateController.setExchangeRate);

// Get Exchange Rate
router.get('/:baseCurrency/:targetCurrency', exchangeRateController.getExchangeRate);

// Get All Exchange Rates
router.get('/all', exchangeRateController.getAllExchangeRates);

// Delete Exchange Rate
router.delete('/exchange-rate/:baseCurrency/:targetCurrency', exchangeRateController.deleteExchangeRate);

// Patch (partial update) Exchange Rate
router.patch('/delete/:baseCurrency/:targetCurrency', exchangeRateController.patchExchangeRate);

module.exports = router;