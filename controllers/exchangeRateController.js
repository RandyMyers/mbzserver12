const ExchangeRate = require('../models/exchangeRate');
const mongoose = require('mongoose');

// Get all exchange rates for an organization
exports.getExchangeRates = async (req, res) => {
  try {
    const { organizationId, baseCurrency, targetCurrency, isActive } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const filter = {
      organizationId: new mongoose.Types.ObjectId(organizationId)
    };

    // Add optional filters
    if (baseCurrency) filter.baseCurrency = baseCurrency;
    if (targetCurrency) filter.targetCurrency = targetCurrency;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const exchangeRates = await ExchangeRate.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: exchangeRates
    });
  } catch (error) {
    console.error('Get Exchange Rates Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch exchange rates"
    });
  }
};

// Get a specific exchange rate
exports.getExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const exchangeRate = await ExchangeRate.findOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    });

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Get Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch exchange rate"
    });
  }
};

// Create a new exchange rate
exports.createExchangeRate = async (req, res) => {
  try {
    const { organizationId, baseCurrency, targetCurrency, rate, isCustom = false, source = 'user' } = req.body;

    if (!organizationId || !baseCurrency || !targetCurrency || !rate) {
      return res.status(400).json({
        success: false,
        error: "Organization ID, base currency, target currency, and rate are required"
      });
    }

    // Validate currency codes
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(baseCurrency) || !currencyRegex.test(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: "Currency codes must be 3 uppercase letters (e.g., USD, EUR, NGN)"
      });
    }

    // Check if same currency
    if (baseCurrency === targetCurrency) {
      return res.status(400).json({
        success: false,
        error: "Base currency and target currency cannot be the same"
      });
    }

    // Check if rate already exists
    const existingRate = await ExchangeRate.findOne({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      baseCurrency,
      targetCurrency
    });

    if (existingRate) {
      return res.status(409).json({
        success: false,
        error: "Exchange rate already exists for this currency pair"
      });
    }

    const exchangeRate = new ExchangeRate({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      baseCurrency,
      targetCurrency,
      rate: parseFloat(rate),
      isCustom,
      source
    });

    await exchangeRate.save();

    res.status(201).json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Create Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create exchange rate"
    });
  }
};

// Update an exchange rate
exports.updateExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, rate, isActive } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const updateData = {};
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      {
        _id: id,
        organizationId: new mongoose.Types.ObjectId(organizationId)
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      data: exchangeRate
    });
  } catch (error) {
    console.error('Update Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update exchange rate"
    });
  }
};

// Delete an exchange rate
exports.deleteExchangeRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Organization ID is required"
      });
    }

    const exchangeRate = await ExchangeRate.findOneAndDelete({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    });

    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        error: "Exchange rate not found"
      });
    }

    res.json({
      success: true,
      message: "Exchange rate deleted successfully"
    });
  } catch (error) {
    console.error('Delete Exchange Rate Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to delete exchange rate"
    });
  }
};

// Bulk create exchange rates
exports.bulkCreateExchangeRates = async (req, res) => {
  try {
    const { organizationId, rates } = req.body;

    if (!organizationId || !rates || !Array.isArray(rates)) {
      return res.status(400).json({
        success: false,
        error: "Organization ID and rates array are required"
      });
    }

    const exchangeRates = [];
    const errors = [];

    for (const rateData of rates) {
      try {
        const { baseCurrency, targetCurrency, rate, isCustom = false, source = 'user' } = rateData;

        if (!baseCurrency || !targetCurrency || !rate) {
          errors.push(`Missing required fields for rate: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Validate currency codes
        const currencyRegex = /^[A-Z]{3}$/;
        if (!currencyRegex.test(baseCurrency) || !currencyRegex.test(targetCurrency)) {
          errors.push(`Invalid currency codes for rate: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Check if same currency
        if (baseCurrency === targetCurrency) {
          errors.push(`Base and target currency cannot be the same: ${JSON.stringify(rateData)}`);
          continue;
        }

        // Check if rate already exists
        const existingRate = await ExchangeRate.findOne({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          baseCurrency,
          targetCurrency
        });

        if (existingRate) {
          errors.push(`Exchange rate already exists for ${baseCurrency} to ${targetCurrency}`);
          continue;
        }

        const exchangeRate = new ExchangeRate({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          baseCurrency,
          targetCurrency,
          rate: parseFloat(rate),
          isCustom,
          source
        });

        exchangeRates.push(exchangeRate);
      } catch (error) {
        errors.push(`Error processing rate: ${JSON.stringify(rateData)} - ${error.message}`);
      }
    }

    if (exchangeRates.length > 0) {
      await ExchangeRate.insertMany(exchangeRates);
    }

    res.json({
      success: true,
      data: {
        created: exchangeRates.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk Create Exchange Rates Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create exchange rates"
    });
  }
};

// Get currency conversion
exports.convertCurrency = async (req, res) => {
  try {
    const { organizationId, amount, fromCurrency, toCurrency } = req.query;

    if (!organizationId || !amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: "Organization ID, amount, from currency, and to currency are required"
      });
    }

    const currencyUtils = require('../utils/currencyUtils');
    const convertedAmount = await currencyUtils.convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency,
      organizationId
    );

    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency
      }
    });
  } catch (error) {
    console.error('Convert Currency Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to convert currency"
    });
  }
}; 