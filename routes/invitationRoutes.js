const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.post('/', invitationController.createInvitation);
router.get('/', invitationController.getInvitations);
router.get('/:invitationId', invitationController.getInvitationById);
router.post('/:invitationId/resend', invitationController.resendInvitation);
router.post('/:invitationId/cancel', invitationController.cancelInvitation);
router.post('/accept', invitationController.acceptInvitation);
router.delete('/:invitationId', invitationController.deleteInvitation);

module.exports = router; 