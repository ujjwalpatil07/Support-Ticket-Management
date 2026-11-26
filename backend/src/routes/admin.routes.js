import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { ROLES } from '../utils/constants.js';
import {
  updatePrioritySchema,
  updateStatusSchema,
} from '../validators/ticket.validator.js';

const router = Router();

router.use(authenticate, authorizeRoles(ROLES.ADMIN));

router.patch(
  '/tickets/:id/status',
  validateObjectId('id'),
  validate({ body: updateStatusSchema }),
  ticketController.updateTicketStatus
);

router.patch(
  '/tickets/:id/priority',
  validateObjectId('id'),
  validate({ body: updatePrioritySchema }),
  ticketController.updateTicketPriority
);

export default router;
