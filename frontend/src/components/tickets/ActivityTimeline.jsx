import {
  Activity as ActivityIcon,
  CheckCircle2,
  Edit3,
  Flag,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

const EVENT_ICON_MAP = {
  'ticket.created': { icon: PlusCircle, color: 'bg-indigo-50 text-indigo-600' },
  'ticket.updated': { icon: Edit3, color: 'bg-slate-100 text-slate-600' },
  'ticket.statusChanged': { icon: RefreshCw, color: 'bg-amber-50 text-amber-600' },
  'ticket.priorityChanged': { icon: Flag, color: 'bg-orange-50 text-orange-600' },
  'ticket.resolved': { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  'comment.added': { icon: MessageSquare, color: 'bg-sky-50 text-sky-600' },
  'ticket.deleted': { icon: Trash2, color: 'bg-rose-50 text-rose-600' },
};

export function ActivityTimeline({ activities = [] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
        <ActivityIcon className="h-4 w-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Activity Timeline</h2>
      </div>

      <div className="p-5">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-3 space-y-5">
            {activities.map((item) => {
              const meta = EVENT_ICON_MAP[item.eventType] || {
                icon: ActivityIcon,
                color: 'bg-slate-100 text-slate-600',
              };
              const Icon = meta.icon;

              return (
                <li key={item._id} className="ml-6 relative">
                  <span
                    className={`absolute -left-9 top-0.5 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${meta.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{item.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
