import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from '../validators/ticket.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createTicketSchema }), ticketController.createTicket);
router.get('/', validate({ query: listTicketsQuerySchema }), ticketController.listTickets);
router.get('/:id', validateObjectId('id'), ticketController.getTicketById);
router.patch(
  '/:id',
  validateObjectId('id'),
  validate({ body: updateTicketSchema }),
  ticketController.updateTicket
);
router.delete('/:id', validateObjectId('id'), ticketController.deleteTicket);

export default router;
