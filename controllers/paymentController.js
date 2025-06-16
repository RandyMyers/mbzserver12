const Payment = require('../models/payment');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const PaymentGatewayKey = require('../models/paymentGatewayKey');
const axios = require('axios');
const logEvent = require('../helper/logEvent');

// POST /api/payments/initiate
// Body: { userId, planId, gateway, amount, currency }
exports.initiatePayment = async (req, res) => {
  try {
    const { userId, planId, gateway, amount, currency } = req.body;
    console.log(req.body);
    if (!userId || !planId || !gateway || !amount || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const reference = uuidv4();
    const payment = await Payment.create({
      userId,
      planId,
      gateway,
      amount,
      currency,
      reference,
      status: 'pending',
    });
    await logEvent({
      action: 'initiate_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { ...payment.toObject() },
      organization: req.user.organization
    });
    return res.json({ reference, paymentId: payment._id });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/payments/upload-proof
// Accepts a file (screenshot) and uploads to Cloudinary, returns the URL
exports.uploadPaymentProof = async (req, res) => {
  try {
    if (!req.files || !req.files.screenshot) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const file = req.files.screenshot;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'payment_proofs',
    });
    return res.status(200).json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload payment proof' });
  }
};

// POST /api/payments/initiate-squad
// Body: { userId, planId, amount, currency, email, name }
exports.initiateSquadPayment = async (req, res) => {
  try {
    const { userId, planId, amount, currency, email, name } = req.body;
    console.log(req.body);
    if (!userId || !planId || !amount || !currency || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Get Squad keys from DB
    const gatewayKey = await PaymentGatewayKey.findOne({ type: 'squad', isActive: true });
    console.log(gatewayKey.publicKey, gatewayKey.secretKey);
    if (!gatewayKey) {
      return res.status(500).json({ message: 'Squad gateway keys not found' });
    }
    // Prepare request
    const squadAmount = Math.round(amount * 100); // NGN in kobo
    const CallBack_URL =  'https://mbztechnology.com';
    const payload = {
      amount: squadAmount,
      email,
      key: gatewayKey.publicKey,
      currency,
      initiate_type: 'inline',
      CallBack_URL,
      customer_name: name,
      payment_channels: ['card'],
      
    };
    const squadRes = await axios.post(
      'https://sandbox-api.squadco.com/payment/Initiate',
      payload,
      {
        headers: {
          Authorization: `Bearer ${gatewayKey.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = squadRes.data;
    if (data.status !== 200 || !data.data?.checkout_url) {
      return res.status(500).json({ message: 'Failed to initiate Squad payment', squadResponse: data });
    }
    // Optionally, create a payment record here with status 'pending' and store transaction_ref
    await logEvent({
      action: 'initiate_squad_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: data.data.transaction_ref,
      details: { ...data.data },
      organization: req.user.organization
    });
    return res.json({ checkout_url: data.data.checkout_url, transaction_ref: data.data.transaction_ref });
  } catch (err) {
    if (err.response) {
      console.log(err.response);
      return res.status(500).json({ message: 'Squad error', error: err.response.data });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In processPayment (after processing the payment)
exports.processPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    // Process the payment
    payment.status = 'processed';
    await payment.save();
    await logEvent({
      action: 'process_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { ...payment.toObject() },
      organization: req.user.organization
    });
    return res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In paymentFailed (after payment fails)
exports.paymentFailed = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const { reason } = req.body;
    payment.status = 'failed';
    await payment.save();
    await logEvent({
      action: 'payment_failed',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { reason },
      organization: req.user.organization
    });
    return res.json({ message: 'Payment failed', reason });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// In refundPayment (after refunding the payment)
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const { refundAmount, reason } = req.body;
    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    await payment.save();
    await logEvent({
      action: 'refund_payment',
      user: req.user._id,
      resource: 'Payment',
      resourceId: payment._id,
      details: { refundAmount, reason },
      organization: req.user.organization
    });
    return res.json({ message: 'Payment refunded successfully', refundAmount, reason });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 