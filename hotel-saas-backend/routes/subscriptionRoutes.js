const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const subscriptionController = require('../controllers/subscriptionController');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager'));

// Route to fetch subscriptions
router.get('/subscriptions', subscriptionController.getAllSubscriptions);
router.get('/subscriptions-by-user', subscriptionController.getUserSubscriptions);

module.exports = router;
