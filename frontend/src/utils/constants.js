export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const TICKET_CATEGORIES = [
  'Technical Issue',
  'Account Issue',
  'Payment Issue',
  'General Inquiry',
  'Other',
];

export const ALLOWED_STATUS_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Open', 'Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: ['Open'],
};

export const STATUS_COLORS = {
  Open: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PRIORITY_COLORS = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
};
