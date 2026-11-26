import { Ticket } from '../models/Ticket.js';
import { ApiError } from '../utils/ApiError.js';
import { ALLOWED_STATUS_TRANSITIONS, ROLES } from '../utils/constants.js';
import { appEvents } from '../events/eventEmitter.js';
import { EVENT_TYPES } from '../events/eventTypes.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function assertTicketAccess(ticket, user) {
  if (!ticket || ticket.isDeleted) {
    throw new ApiError(404, 'Ticket not found');
  }

  if (user.role === ROLES.ADMIN) {
    return;
  }

  const ownerId = ticket.createdBy?._id || ticket.createdBy;
  if (!ownerId || !ownerId.equals(user._id)) {
    throw new ApiError(403, 'You do not have permission to access this ticket');
  }
}

export async function findActiveTicketOrFail(ticketId, populateCreator = false) {
  let query = Ticket.findOne({ _id: ticketId, isDeleted: false });
  if (populateCreator) {
    query = query.populate('createdBy', 'name email role');
  }
  const ticket = await query;
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  return ticket;
}

export async function createTicket(data, user) {
  const ticket = await Ticket.create({
    title: data.title,
    description: data.description,
    category: data.category || 'Other',
    priority: data.priority || 'Medium',
    status: 'Open',
    createdBy: user._id,
  });

  await ticket.populate('createdBy', 'name email role');

  await appEvents.emitAsync(EVENT_TYPES.TICKET_CREATED, {
    ticket,
    actor: user,
  });

  return ticket;
}

export async function listTickets(query, user) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    category,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = { isDeleted: false };

  if (user.role !== ROLES.ADMIN) {
    filter.createdBy = user._id;
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const direction = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: direction, _id: direction };
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role')
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    tickets,
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

export async function getTicketById(ticketId, user) {
  const ticket = await findActiveTicketOrFail(ticketId, true);
  assertTicketAccess(ticket, user);
  return ticket;
}

export async function updateTicket(ticketId, updates, user) {
  const ticket = await findActiveTicketOrFail(ticketId, true);
  assertTicketAccess(ticket, user);

  if (user.role !== ROLES.ADMIN && ticket.status !== 'Open') {
    throw new ApiError(400, 'Tickets can only be edited while status is Open');
  }

  const allowedFields = ['title', 'description', 'category'];
  const changedFields = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined && updates[field] !== ticket[field]) {
      ticket[field] = updates[field];
      changedFields.push(field);
    }
  }

  if (changedFields.length === 0) {
    return ticket;
  }

  await ticket.save();

  await appEvents.emitAsync(EVENT_TYPES.TICKET_UPDATED, {
    ticket,
    actor: user,
    changedFields,
  });

  return ticket;
}

export async function softDeleteTicket(ticketId, user) {
  const ticket = await findActiveTicketOrFail(ticketId);
  assertTicketAccess(ticket, user);

  if (user.role !== ROLES.ADMIN && ticket.status !== 'Open') {
    throw new ApiError(400, 'Tickets can only be deleted while status is Open');
  }

  ticket.isDeleted = true;
  ticket.deletedAt = new Date();
  ticket.deletedBy = user._id;
  await ticket.save();

  await appEvents.emitAsync(EVENT_TYPES.TICKET_DELETED, {
    ticket,
    actor: user,
  });

  return ticket;
}

export async function updateTicketStatus(ticketId, newStatus, adminUser) {
  const ticket = await findActiveTicketOrFail(ticketId, true);
  const previousStatus = ticket.status;

  if (previousStatus === newStatus) {
    throw new ApiError(400, `Ticket is already in "${newStatus}" status`);
  }

  const allowedNext = ALLOWED_STATUS_TRANSITIONS[previousStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from "${previousStatus}" to "${newStatus}"`
    );
  }

  const isReopened =
    (previousStatus === 'Resolved' && newStatus === 'In Progress') ||
    (previousStatus === 'Closed' && newStatus === 'Open');

  ticket.status = newStatus;

  if (newStatus === 'Resolved') {
    ticket.resolvedAt = new Date();
  } else if (newStatus === 'Closed') {
    ticket.closedAt = new Date();
  } else if (isReopened) {
    ticket.resolvedAt = null;
    ticket.closedAt = null;
  }

  await ticket.save();

  await appEvents.emitAsync(EVENT_TYPES.TICKET_STATUS_CHANGED, {
    ticket,
    actor: adminUser,
    previousStatus,
    newStatus,
    isReopened,
  });

  if (newStatus === 'Resolved') {
    await appEvents.emitAsync(EVENT_TYPES.TICKET_RESOLVED, {
      ticket,
      actor: adminUser,
    });
  }

  return ticket;
}

export async function updateTicketPriority(ticketId, newPriority, adminUser) {
  const ticket = await findActiveTicketOrFail(ticketId, true);
  const previousPriority = ticket.priority;

  if (previousPriority === newPriority) {
    return ticket;
  }

  ticket.priority = newPriority;
  await ticket.save();

  await appEvents.emitAsync(EVENT_TYPES.TICKET_PRIORITY_CHANGED, {
    ticket,
    actor: adminUser,
    previousPriority,
    newPriority,
  });

  return ticket;
}
