import { PRIORITY_COLORS, STATUS_COLORS } from '../../utils/constants';

export function StatusBadge({ status }) {
  const classes =
    STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${classes}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const classes =
    PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${classes}`}
    >
      {priority}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {category}
    </span>
  );
}

export function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        isAdmin
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}
