const ExchangeRate = require('../models/exchangeRate');
const Organization = require('../models/organization');
const User = require('../models/users');

/**
 * Get the display currency for a user or organization
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string>} - Display currency code
 */
const getDisplayCurrency = async (userId, organizationId) => {
  try {
    // First try to get user's preferred currency
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.displayCurrency) {
        return user.displayCurrency;
      }
    }

    // Fall back to organization's analytics currency
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (organization && organization.analyticsCurrency) {
        return organization.analyticsCurrency;
      }
      // Fall back to default currency if analytics currency not set
      if (organization && organization.defaultCurrency) {
        return organization.defaultCurrency;
      }
    }

    // Default fallback
    return 'USD';
  } catch (error) {
    console.error('Error getting display currency:', error);
    return 'USD';
  }
};

/**
 * Get organization's analytics currency
 * @param {string} organizationId - Organization ID
 * @returns {Promise<string>} - Analytics currency code
 */
const getOrganizationAnalyticsCurrency = async (organizationId) => {
  try {
    if (!organizationId) return 'USD';
    
    const organization = await Organization.findById(organizationId);
    if (organization && organization.analyticsCurrency) {
      return organization.analyticsCurrency;
    }
    
    // Fall back to default currency
    if (organization && organization.defaultCurrency) {
      return organization.defaultCurrency;
    }
    
    return 'USD';
  } catch (error) {
    console.error('Error getting organization analytics currency:', error);
    return 'USD';
  }
};

/**
 * Get exchange rate for organization-specific conversion
 * @param {string} organizationId - Organization ID
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number|null>} - Exchange rate or null if not found
 */
const getExchangeRate = async (organizationId, fromCurrency, toCurrency) => {
  try {
    if (!organizationId || !fromCurrency || !toCurrency) {
      return null;
    }

    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // First try to get organization-specific rate
    let exchangeRate = await ExchangeRate.findOne({
      organizationId: new require('mongoose').Types.ObjectId(organizationId),
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      isActive: true
    });

    if (exchangeRate) {
      return exchangeRate.rate;
    }

    // Try reverse rate
    exchangeRate = await ExchangeRate.findOne({
      organizationId: new require('mongoose').Types.ObjectId(organizationId),
      baseCurrency: toCurrency,
      targetCurrency: fromCurrency,
      isActive: true
    });

    if (exchangeRate) {
      return 1 / exchangeRate.rate;
    }

    // If no organization-specific rate, try global/system rates
    exchangeRate = await ExchangeRate.findOne({
      organizationId: null, // Global/system rates
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      isActive: true
    });

    if (exchangeRate) {
      return exchangeRate.rate;
    }

    // Try reverse global rate
    exchangeRate = await ExchangeRate.findOne({
      organizationId: null,
      baseCurrency: toCurrency,
      targetCurrency: fromCurrency,
      isActive: true
    });

    if (exchangeRate) {
      return 1 / exchangeRate.rate;
    }

    return null;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return null;
  }
};

/**
 * Convert amount from source currency to target currency
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<number>} - Converted amount
 */
const convertCurrency = async (amount, fromCurrency, toCurrency, organizationId = null) => {
  try {
    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await getExchangeRate(organizationId, fromCurrency, toCurrency);
    
    if (rate === null) {
      // If no exchange rate found, return original amount with warning
      console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency} for organization ${organizationId}`);
      return amount;
    }

    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount; // Return original amount on error
  }
};

/**
 * Convert multiple amounts with different currencies to a target currency
 * @param {Array} amounts - Array of objects with amount and currency
 * @param {string} targetCurrency - Target currency code
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<number>} - Total converted amount
 */
const convertMultipleCurrencies = async (amounts, targetCurrency, organizationId = null) => {
  try {
    let totalConverted = 0;

    for (const item of amounts) {
      const { amount, currency } = item;
      if (amount && currency) {
        const convertedAmount = await convertCurrency(amount, currency, targetCurrency, organizationId);
        totalConverted += convertedAmount;
      }
    }

    return totalConverted;
  } catch (error) {
    console.error('Error converting multiple currencies:', error);
    return 0;
  }
};

/**
 * Enhanced aggregation pipeline for multi-currency revenue calculations
 * @param {string} organizationId - Organization ID
 * @param {string} targetCurrency - Target currency for conversion
 * @param {Object} additionalFilters - Additional MongoDB filters
 * @returns {Array} - MongoDB aggregation pipeline
 */
const createMultiCurrencyRevenuePipeline = (organizationId, targetCurrency, additionalFilters = {}) => {
  return [
    {
      $match: {
        organizationId: new require('mongoose').Types.ObjectId(organizationId),
        status: { $nin: ['cancelled', 'refunded'] },
        total: { $exists: true, $ne: "" },
        ...additionalFilters
      }
    },
    {
      $addFields: {
        numericTotal: {
          $cond: [
            { $eq: [{ $type: "$total" }, "string"] },
            { $toDouble: "$total" },
            "$total"
          ]
        },
        orderCurrency: {
          $ifNull: ["$currency", "USD"] // Default to USD if no currency specified
        }
      }
    },
    {
      $match: {
        numericTotal: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: "$orderCurrency",
        totalAmount: { $sum: "$numericTotal" },
        orderCount: { $sum: 1 }
      }
    }
  ];
};

/**
 * Process multi-currency aggregation results and convert to target currency
 * @param {Array} aggregationResults - Results from multi-currency aggregation
 * @param {string} targetCurrency - Target currency for conversion
 * @param {string} organizationId - Organization ID for org-specific rates
 * @returns {Promise<Object>} - Processed results with converted totals
 */
const processMultiCurrencyResults = async (aggregationResults, targetCurrency, organizationId = null) => {
  try {
    let totalConverted = 0;
    let totalOrders = 0;
    const currencyBreakdown = {};

    for (const result of aggregationResults) {
      const { _id: currency, totalAmount, orderCount } = result;
      
      const convertedAmount = await convertCurrency(totalAmount, currency, targetCurrency, organizationId);
      totalConverted += convertedAmount;
      totalOrders += orderCount;
      
      currencyBreakdown[currency] = {
        originalAmount: totalAmount,
        convertedAmount,
        orderCount
      };
    }

    return {
      totalConverted,
      totalOrders,
      targetCurrency,
      currencyBreakdown
    };
  } catch (error) {
    console.error('Error processing multi-currency results:', error);
    return {
      totalConverted: 0,
      totalOrders: 0,
      targetCurrency,
      currencyBreakdown: {}
    };
  }
};

/**
 * Get currency statistics for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Currency statistics
 */
const getCurrencyStats = async (organizationId) => {
  try {
    const stats = await require('../models/order').aggregate([
      {
        $match: {
          organizationId: new require('mongoose').Types.ObjectId(organizationId),
          status: { $nin: ['cancelled', 'refunded'] },
          currency: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$currency",
          totalAmount: { $sum: { $toDouble: "$total" } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    console.error('Error getting currency stats:', error);
    return [];
  }
};

/**
 * Convert order amounts to target currency for analytics
 * @param {Array} orders - Array of order objects
 * @param {string} targetCurrency - Target currency code
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array>} - Orders with converted amounts
 */
const convertOrderAmounts = async (orders, targetCurrency, organizationId) => {
  try {
    const convertedOrders = [];

    for (const order of orders) {
      const convertedOrder = { ...order };
      
      if (order.total && order.currency) {
        convertedOrder.convertedTotal = await convertCurrency(
          parseFloat(order.total), 
          order.currency, 
          targetCurrency, 
          organizationId
        );
        convertedOrder.targetCurrency = targetCurrency;
      }

      // Convert line items if they exist
      if (order.line_items && Array.isArray(order.line_items)) {
        convertedOrder.line_items = await Promise.all(
          order.line_items.map(async (item) => {
            const convertedItem = { ...item };
            if (item.subtotal && order.currency) {
              convertedItem.convertedSubtotal = await convertCurrency(
                parseFloat(item.subtotal),
                order.currency,
                targetCurrency,
                organizationId
              );
            }
            return convertedItem;
          })
        );
      }

      convertedOrders.push(convertedOrder);
    }

    return convertedOrders;
  } catch (error) {
    console.error('Error converting order amounts:', error);
    return orders; // Return original orders on error
  }
};

module.exports = {
  getDisplayCurrency,
  getOrganizationAnalyticsCurrency,
  getExchangeRate,
  convertCurrency,
  convertMultipleCurrencies,
  createMultiCurrencyRevenuePipeline,
  processMultiCurrencyResults,
  getCurrencyStats,
  convertOrderAmounts
}; 