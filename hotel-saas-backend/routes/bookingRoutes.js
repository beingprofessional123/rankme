const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const bookingController = require('../controllers/bookingController');

// Apply middlewares to all booking routes
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager', 'general_manager', 'analyst'));

// Get all bookings (optionally filter by company_id via query param)
router.get('/list', bookingController.getAllBookings);

module.exports = router;
