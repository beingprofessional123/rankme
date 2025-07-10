const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin','revenue_manager','general_manager','analyst')); 

// Route for payment
router.post('/create-payment', paymentController.createPayment);
router.post('/verify-stripe', paymentController.verifyStripePayment);

module.exports = router;
