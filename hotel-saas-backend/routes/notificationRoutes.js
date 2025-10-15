const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const notificationController = require('../controllers/notificationController');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin','revenue_manager','general_manager','analyst')); 

// Route to fetch subscriptions
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Route to delete a specific notification
router.delete('/notifications/:id', notificationController.deleteNotification);

// Route to mark all notifications as read
router.put('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;