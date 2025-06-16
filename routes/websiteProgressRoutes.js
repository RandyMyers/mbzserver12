const express = require('express');
const router = express.Router();
const progressController = require('../controllers/websiteProgressControllers');


// Get website progress
router.get('/:websiteId', progressController.getWebsiteProgress);

// Update current step
router.patch('/:websiteId/step', progressController.updateCurrentStep);

// Add progress note
router.post('/:websiteId/notes', progressController.addProgressNote);

// Update note status
router.patch('/:websiteId/notes/:noteId', progressController.updateNoteStatus);

// Upload design asset
router.post('/:websiteId/assets',  progressController.uploadDesignAsset);

// Assign designer
router.post('/:websiteId/designers', progressController.assignDesigner);

// Add milestone
router.post('/:websiteId/milestones', progressController.addMilestone);

// Update milestone status
router.patch('/:websiteId/milestones/:milestoneId', progressController.updateMilestoneStatus);

// Record approval
router.post('/:websiteId/approvals', progressController.recordApproval);

// Add version
router.post('/:websiteId/versions', progressController.addVersion);

// Add feedback
router.post('/:websiteId/feedback',  progressController.addFeedback);

// Update feedback status
router.patch('/:websiteId/feedback/:feedbackId', progressController.updateFeedbackStatus);

// Record QA check
router.post('/:websiteId/qa-checks', progressController.recordQACheck);

module.exports = router;