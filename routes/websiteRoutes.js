const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteControllers');


// Website creation and domain check
router.post('/create',  websiteController.createWebsite);
router.get('/check-domain', websiteController.checkDomain);

// Website CRUD operations
router.get('/organization/:organizationId', websiteController.getOrganizationWebsites);
router.delete('/delete/:id', websiteController.deleteWebsite);

// Step-by-step website configuration
router.patch('/basic-info/:id', websiteController.updateBasicInfo);
router.patch('/business-info/:id', websiteController.updateBusinessInfo);
router.patch('/colors/:id', websiteController.updateColors);
router.patch('/emails/:id', websiteController.updateEmails);

// Super admin routes
router.get('/all/:userId', websiteController.getAllWebsites);
router.get('/analytics/:userId', websiteController.getWebsiteAnalytics);

// Organization analytics
router.get('/analytics/organization/:organizationId', websiteController.getOrganizationWebsiteAnalytics);


module.exports = router;