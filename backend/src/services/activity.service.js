import { Activity } from '../models/Activity.js';
import { assertTicketAccess, findActiveTicketOrFail } from './ticket.service.js';

export async function getTicketActivities(ticketId, user) {
  const ticket = await findActiveTicketOrFail(ticketId);
  assertTicketAccess(ticket, user);

  const activities = await Activity.find({ ticket: ticket._id })
    .sort({ createdAt: 1 })
    .populate('actor', 'name email role')
    .lean();

  return activities;
}
