const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const supportTicketController = require('../controllers/supportTicketController');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager', 'general_manager', 'analyst'));

// **** CRITICAL FIX: PLACE SPECIFIC ROUTES BEFORE DYNAMIC ROUTES ****

// Route to create a new support ticket (MOST SPECIFIC, PUT IT FIRST)
router.post('/support-ticket/create', supportTicketController.createSupportTicket);

// Route to delete a support ticket (also specific, place before general :id)
router.delete('/support-ticket/delete/:id', supportTicketController.deleteSupportTicketDetails);

// Route to add a message to a support ticket thread (also specific, place before general :id)
router.post('/support-ticket/:id/message', supportTicketController.addSupportTicketMessage);

// Route to fetch support tickets (list view) - this one is fine here or higher up
router.get('/support-ticket/list', supportTicketController.getSupportTickets);

// Route to fetch a single support ticket and its details (DYNAMIC :id, place AFTER specific ones)
router.get('/support-ticket/:id', supportTicketController.getSupportTicketDetails);

// Route to update an existing support ticket (DYNAMIC :id, place AFTER specific ones)
router.put('/support-ticket/:id', supportTicketController.updateSupportTicket);

module.exports = router;