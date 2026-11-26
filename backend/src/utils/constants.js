export const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const TICKET_STATUSES = Object.freeze([
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
]);

export const TICKET_PRIORITIES = Object.freeze([
  'Low',
  'Medium',
  'High',
  'Critical',
]);

export const TICKET_CATEGORIES = Object.freeze([
  'Technical Issue',
  'Account Issue',
  'Payment Issue',
  'General Inquiry',
  'Other',
]);

export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  Open: ['In Progress'],
  'In Progress': ['Open', 'Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: ['Open'],
});
