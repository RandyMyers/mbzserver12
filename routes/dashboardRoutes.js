const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard overview stats
router.get('/overview/:organizationId', dashboardController.getOverviewStats);

module.exports = router; 