const express = require('express');
const router = express.Router();
const supportTicketController = require('../../controllers/admin/supportTicketController');
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const adminUpload  = require('../../middlewares/adminUpload');

// 🔐 Middleware: Only accessible to authenticated super_admins
const adminAuth = [authenticate, authorizeRoles('super_admin')];

// GET all support tickets
router.get('/', adminAuth, supportTicketController.listTickets);

// GET a single support ticket by ID
router.get('/:id', adminAuth, supportTicketController.getTicketById);

// PUT/PATCH to update a support ticket (including adding a new message/reply)
router.put('/:id', adminAuth, adminUpload.single('fileAttachment'), supportTicketController.updateTicket);

// DELETE a support ticket
router.delete('/:id', adminAuth, supportTicketController.deleteTicket);

module.exports = router;