const express = require('express');
const router = express.Router();
const paymentGatewayKeyController = require('../controllers/paymentGatewayKeyController');

// CRUD endpoints
router.get('/', paymentGatewayKeyController.getAllKeys);
router.get('/:type', paymentGatewayKeyController.getKey);
router.post('/', paymentGatewayKeyController.createKey);
router.put('/:type', paymentGatewayKeyController.updateKey);
router.delete('/:type', paymentGatewayKeyController.deleteKey);

// Public endpoint to get the public key for a payment gateway
router.get('/:type/public-key', paymentGatewayKeyController.getPublicKey);

module.exports = router; 