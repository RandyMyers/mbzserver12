const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');


// Template CRUD operations
router.post('/create', templateController.createTemplate);
router.get('/all', templateController.getAllTemplates);
router.get('/get/:id', templateController.getTemplateById);
router.patch('/update/:id', templateController.updateTemplate);
router.delete('/delete/:id', templateController.deleteTemplate);

// User-specific templates
router.get('/user/:userId', templateController.getUserTemplates);

// Analytics (admin only)
router.get('/analytics/all', templateController.getTemplateAnalytics);

module.exports = router;