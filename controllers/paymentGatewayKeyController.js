const PaymentGatewayKey = require('../models/paymentGatewayKey');

// GET /api/payment-gateways/ - List all keys
exports.getAllKeys = async (req, res) => {
  try {
    const keys = await PaymentGatewayKey.find();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/payment-gateways/:type - Get key by type
exports.getKey = async (req, res) => {
  try {
    const { type } = req.params;
    const key = await PaymentGatewayKey.findOne({ type });
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json(key);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/payment-gateways/ - Create new key
exports.createKey = async (req, res) => {
  try {
    const {
      type,
      name,
      description,
      logoUrl,
      publicKey,
      secretKey,
      isActive
    } = req.body;
    const key = new PaymentGatewayKey({
      type,
      name,
      description,
      logoUrl,
      publicKey,
      secretKey,
      isActive
    });
    await key.save();
    res.status(201).json(key);
  } catch (err) {
    res.status(400).json({ message: 'Error creating key', error: err.message });
  }
};

// PUT /api/payment-gateways/:type - Update key by type
exports.updateKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { publicKey, secretKey, isActive } = req.body;
    const key = await PaymentGatewayKey.findOneAndUpdate(
      { type },
      { publicKey, secretKey, isActive, updatedAt: Date.now() },
      { new: true }
    );
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json(key);
  } catch (err) {
    res.status(400).json({ message: 'Error updating key', error: err.message });
  }
};

// DELETE /api/payment-gateways/:type - Delete key by type
exports.deleteKey = async (req, res) => {
  try {
    const { type } = req.params;
    const key = await PaymentGatewayKey.findOneAndDelete({ type });
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json({ message: 'Key deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/payment-gateways/:type/public-key
exports.getPublicKey = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(type);
    const gatewayKey = await PaymentGatewayKey.findOne({ type, isActive: true });
    if (!gatewayKey) {
      return res.status(404).json({ message: `No active public key found for gateway: ${type}` });
    }
    return res.json({ publicKey: gatewayKey.publicKey });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 