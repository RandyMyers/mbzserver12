const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Endpoint to initiate a payment
router.post('/initiate', paymentController.initiatePayment);

// Endpoint to upload payment proof (bank transfer)
router.post('/upload-proof', paymentController.uploadPaymentProof);

// Endpoint to initiate Squad payment
router.post('/initiate-squad', paymentController.initiateSquadPayment);

module.exports = router; 