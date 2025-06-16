const express = require('express');
const router = express.Router();
const planController = require('../controllers/subscriptionPlanController');

// Create a new plan
router.post('/', planController.createPlan);
// Get all plans
router.get('/', planController.getPlans);
// Get a plan by ID
router.get('/:id', planController.getPlanById);
// Update a plan
router.put('/:id', planController.updatePlan);
// Delete a plan
router.delete('/:id', planController.deletePlan);

module.exports = router; 