import { Comment } from '../models/Comment.js';
import { appEvents } from '../events/eventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';
import { assertTicketAccess, findActiveTicketOrFail } from './ticket.service.js';

export async function addComment(ticketId, message, user) {
  const ticket = await findActiveTicketOrFail(ticketId);
  assertTicketAccess(ticket, user);

  const comment = await Comment.create({
    ticket: ticket._id,
    author: user._id,
    message,
  });

  await comment.populate('author', 'name email role');

  await appEvents.emitAsync(EVENT_TYPES.COMMENT_ADDED, {
    ticket,
    comment,
    actor: user,
  });

  return comment;
}

export async function getCommentsByTicket(ticketId, user) {
  const ticket = await findActiveTicketOrFail(ticketId);
  assertTicketAccess(ticket, user);

  const comments = await Comment.find({ ticket: ticket._id })
    .sort({ createdAt: 1 })
    .populate('author', 'name email role')
    .lean();

  return comments;
}
