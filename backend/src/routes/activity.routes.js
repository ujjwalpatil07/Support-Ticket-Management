import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/:id/activities',
  validateObjectId('id'),
  activityController.getTicketActivities
);

export default router;
