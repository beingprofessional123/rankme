const db = require('../../models');

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await db.Notification.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'Notifications fetched successfully',
            results: notifications,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            status: 'error',
            status_code: 500,
            status_message: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch notifications',
        });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await db.Notification.findOne({
            where: { id: id, user_id: userId }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.is_read = true;
        await notification.save();

        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'Notification marked as read',
            results: notification
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.Notification.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );

        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            status: 'error',
            status_code: 500,
            status_message: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to mark all notifications as read',
        });
    }
};

// Delete a specific notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deletedCount = await db.Notification.destroy({
            where: { id: id, user_id: userId },
        });

        if (deletedCount === 0) {
            return res.status(404).json({
                status: 'error',
                status_code: 404,
                status_message: 'NOT_FOUND',
                message: 'Notification not found or not authorized to delete',
            });
        }

        res.status(200).json({
            status: 'success',
            status_code: 200,
            status_message: 'OK',
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            status: 'error',
            status_code: 500,
            status_message: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete notification',
        });
    }
};