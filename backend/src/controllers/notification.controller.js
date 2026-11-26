import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listUserNotifications(
    req.user._id,
    req.query
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});
