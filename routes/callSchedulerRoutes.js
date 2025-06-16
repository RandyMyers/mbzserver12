const express = require('express');
const router = express.Router();
const callSchedulerController = require('../controllers/callSchedulerController');

// All endpoints require organizationId (and userId for create)
// For GET: pass as query params; for POST/PUT/PATCH/DELETE: pass as body fields

router.post('/', callSchedulerController.createCall); // organizationId, userId in body
router.get('/', callSchedulerController.getCalls); // organizationId (and optional userId) in query
router.get('/:id', callSchedulerController.getCallById); // organizationId in query
router.put('/:id', callSchedulerController.updateCall); // organizationId in body
router.patch('/:id/cancel', callSchedulerController.cancelCall); // organizationId in body
router.delete('/:id', callSchedulerController.deleteCall); // organizationId in body

module.exports = router; 