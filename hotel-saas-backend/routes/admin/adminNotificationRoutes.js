const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth');
const { authorizeRoles } = require('../../middlewares/authorize');
const notificationController = require('../../controllers/admin/notificationController');

// Middleware for this route group
const adminAuth = [authenticate, authorizeRoles('super_admin')];

// Route to fetch subscriptions
router.get('/notifications',adminAuth ,notificationController.getNotifications);
router.put('/notifications/:id/read',adminAuth , notificationController.markAsRead);

// Route to delete a specific notification
router.delete('/notifications/:id',adminAuth , notificationController.deleteNotification);

// Route to mark all notifications as read
router.put('/notifications/read-all',adminAuth , notificationController.markAllAsRead);

module.exports = router;
