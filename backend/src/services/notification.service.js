import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';

export async function listUserNotifications(userId, query) {
  const { page = 1, limit = 20, unreadOnly } = query;
  const filter = { recipient: userId };

  if (unreadOnly === true) {
    filter.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('ticket', 'title status priority isDeleted')
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getUnreadCount(userId) {
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return { unreadCount };
}

export async function markNotificationAsRead(notificationId, userId) {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (!notification.recipient.equals(userId)) {
    throw new ApiError(403, 'You do not have permission to update this notification');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}
