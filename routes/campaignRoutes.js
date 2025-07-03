const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignControllers');

// CRUD routes
router.post('/create', campaignController.createCampaign);
router.get('/all', campaignController.getCampaigns);
router.get('/get/:campaignId', campaignController.getCampaignById);
router.patch('/update/:campaignId', campaignController.updateCampaign);
router.delete('/delete/:campaignId', campaignController.deleteCampaign);

// Specialized campaign updates
router.patch('/updateTemplate/:campaignId', campaignController.updateTemplate);
router.patch('/updateContacts/:campaignId', campaignController.updateContacts);
router.patch('/updateSenderEmails/:campaignId', campaignController.updateSenderEmails);
router.patch('/updateTargetCategories/:campaignId', campaignController.updateTargetCategories);
router.patch('/updateStatus/:campaignId', campaignController.updateStatus);

// Start campaign
router.post('/start/:campaignId', campaignController.startCampaign);

// Stats routes for page overview
router.get('/metrics/total-campaigns/:organizationId', campaignController.getTotalCampaigns);
router.get('/metrics/active-campaigns/:organizationId', campaignController.getActiveCampaigns);
router.get('/metrics/emails-sent/:organizationId', campaignController.getEmailsSent);
router.get('/metrics/open-rate/:organizationId', campaignController.getOpenRate);
router.get('/metrics/click-rate/:organizationId', campaignController.getClickRate);

// Stats route for overview
//router.get('/stats/overview', campaignController.getCampaignStats);

// Tracking endpoints
router.get('/track/open/:campaignId/:customerId', campaignController.trackOpen);
// router.get('/track/click/:campaignId/:contactId', campaignController.trackClick); // Implement if needed

module.exports = router; 