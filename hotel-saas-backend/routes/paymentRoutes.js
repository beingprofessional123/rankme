const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin')); 

// Route for payment
router.post('/create-payment', paymentController.createPayment);
router.post('/upgrade-payment', paymentController.upgradePayment);
router.post('/cancel-payment', paymentController.cancelPayment);
router.get('/list-payment', paymentController.listPayment);
router.post('/verify-stripe', paymentController.verifyStripePayment);

module.exports = router;
