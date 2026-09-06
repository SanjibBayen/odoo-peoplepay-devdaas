import models from '../models/index.js';

/**
 * Get current user's notifications
 * GET /api/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 50, offset = 0 } = req.query;

    const notifications = await models.Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    const unreadCount = await models.Notification.count({
      where: { userId, isRead: false },
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    const { id } = req.params;

    const notification = await models.Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.markAsRead();

    const unreadCount = await models.Notification.count({
      where: { userId, isRead: false },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await models.Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
