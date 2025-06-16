const ExchangeRate = require('../models/exchangeRate');

// Create or Update Exchange Rate
exports.setExchangeRate = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, rate } = req.body;
    console.log(req.body);

    if (!baseCurrency || !targetCurrency || !rate) {
      return res.status(400).json({ error: 'All fields are required: baseCurrency, targetCurrency, rate' });
    }

    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { baseCurrency, targetCurrency },
      { rate },
      { new: true, upsert: true } // Create if not exists
    );

    res.status(200).json({ message: 'Exchange rate set successfully', exchangeRate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Exchange Rate
exports.getExchangeRate = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency } = req.params;

    const exchangeRate = await ExchangeRate.findOne({ baseCurrency, targetCurrency });

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    res.status(200).json(exchangeRate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Exchange Rates
exports.getAllExchangeRates = async (req, res) => {
  try {
    const exchangeRates = await ExchangeRate.find();
    res.status(200).json(exchangeRates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Exchange Rate
exports.deleteExchangeRate = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency } = req.params;

    const exchangeRate = await ExchangeRate.findOneAndDelete({ baseCurrency, targetCurrency });

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    res.status(200).json({ message: 'Exchange rate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH: Update only provided fields for an exchange rate
exports.patchExchangeRate = async (req, res) => {
  try {
    const { baseCurrency, targetCurrency } = req.params;
    const update = req.body;
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { baseCurrency, targetCurrency },
      update,
      { new: true }
    );
    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }
    res.status(200).json(exchangeRate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};