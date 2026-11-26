import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../common/Badges';
import { formatDate } from '../../utils/formatters';

export function TicketTable({ tickets = [], basePath = '/tickets', showOwner = false }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Ticket</th>
              {showOwner && <th className="py-3 px-4">Submitted By</th>}
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {tickets.map((ticket) => (
              <tr key={ticket._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 max-w-xs">
                  <Link
                    to={`${basePath}/${ticket._id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                  >
                    {ticket.title}
                  </Link>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {ticket.description}
                  </p>
                </td>
                {showOwner && (
                  <td className="py-3.5 px-4">
                    <div className="text-sm font-medium text-slate-800">
                      {ticket.createdBy?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ticket.createdBy?.email || ''}
                    </div>
                  </td>
                )}
                <td className="py-3.5 px-4">
                  <CategoryBadge category={ticket.category} />
                </td>
                <td className="py-3.5 px-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {formatDate(ticket.createdAt)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    to={`${basePath}/${ticket._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-slate-200">
        {tickets.map((ticket) => (
          <Link
            key={ticket._id}
            to={`${basePath}/${ticket._id}`}
            className="block p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{ticket.title}</h3>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
            {showOwner && ticket.createdBy && (
              <p className="mt-2 text-xs text-slate-600">
                By <span className="font-medium">{ticket.createdBy.name}</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>
              <span className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
