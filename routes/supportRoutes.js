const express = require('express');
const router = express.Router();
const supportControllers = require('../controllers/supportControllers');

// All endpoints require organizationId
// For GET: pass as query params; for POST/PUT/PATCH/DELETE: pass as body fields

router.post('/', supportControllers.createTicket);
router.get('/', supportControllers.getTickets);
router.get('/:id', supportControllers.getTicketById);
router.put('/:id', supportControllers.updateTicket);
router.post('/:id/message', supportControllers.addMessageToTicket);
router.patch('/:id/status', supportControllers.changeTicketStatus);
router.delete('/:id', supportControllers.deleteTicket);

// Chat integration routes
router.post('/chat-integration', supportControllers.addChatIntegration);
router.get('/chat-integration', supportControllers.getChatIntegrations);
router.put('/chat-integration', supportControllers.updateChatIntegration);
router.delete('/chat-integration', supportControllers.deleteChatIntegration);

// Stats routes for page overview
router.get('/metrics/total-tickets/:organizationId', supportControllers.getTotalTickets);
router.get('/metrics/open-tickets/:organizationId', supportControllers.getOpenTickets);
router.get('/metrics/resolved-tickets/:organizationId', supportControllers.getResolvedTickets);
router.get('/metrics/avg-response-time/:organizationId', supportControllers.getAvgResponseTime);

module.exports = router; 