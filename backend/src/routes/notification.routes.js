import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { listNotificationsQuerySchema } from '../validators/notification.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  notificationController.listNotifications
);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validateObjectId('id'), notificationController.markAsRead);

export default router;
