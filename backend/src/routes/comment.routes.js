import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { createCommentSchema } from '../validators/comment.validator.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/:ticketId/comments',
  validateObjectId('ticketId'),
  validate({ body: createCommentSchema }),
  commentController.addComment
);

router.get(
  '/:ticketId/comments',
  validateObjectId('ticketId'),
  commentController.getComments
);

export default router;
