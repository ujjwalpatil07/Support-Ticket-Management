export const EVENT_TYPES = Object.freeze({
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_STATUS_CHANGED: 'ticket.statusChanged',
  TICKET_PRIORITY_CHANGED: 'ticket.priorityChanged',
  TICKET_RESOLVED: 'ticket.resolved',
  COMMENT_ADDED: 'comment.added',
  TICKET_DELETED: 'ticket.deleted',
});

export const EVENT_TYPE_LIST = Object.freeze(Object.values(EVENT_TYPES));
