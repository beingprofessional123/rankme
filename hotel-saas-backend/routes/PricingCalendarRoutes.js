const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const PricingCalendarController = require('../controllers/PricingCalendarController');

// Middleware for this route group
router.use(authenticate); // ✅ Ensures only logged-in users access this route
router.use(authorizeRoles('company_admin','revenue_manager','general_manager','analyst')); 

// Route to fetch property pricing
router.get('/property-price', PricingCalendarController.getPropertyPrice);
router.get('/booking-data', PricingCalendarController.getBookingData);

module.exports = router;
