import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  FolderOpen,
  Lock,
  Ticket as TicketIcon,
} from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { StatCard } from '../../components/common/StatCard';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '../../components/common/States';
import { TicketCharts } from '../../components/dashboard/TicketCharts';
import { TicketTable } from '../../components/tickets/TicketTable';
import { dashboardService } from '../../services/dashboardService';
import { formatRelativeTime, getApiErrorMessage } from '../../utils/formatters';

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load admin dashboard statistics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <AppLayout
      title="Helpdesk Operations"
      breadcrumbs={[{ label: 'Admin Dashboard' }]}
      actions={
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
        >
          Manage All Tickets
        </Link>
      }
    >
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStats} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets}
              icon={TicketIcon}
              accent="indigo"
            />
            <StatCard
              title="Open"
              value={stats.openTickets}
              icon={FolderOpen}
              accent="indigo"
            />
            <StatCard
              title="In Progress"
              value={stats.inProgressTickets}
              icon={Clock}
              accent="amber"
            />
            <StatCard
              title="Resolved"
              value={stats.resolvedTickets}
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              title="Closed"
              value={stats.closedTickets}
              icon={Lock}
              accent="slate"
            />
          </div>

          <TicketCharts
            statusDistribution={stats.statusDistribution}
            priorityDistribution={stats.priorityDistribution}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Recent Tickets
                </h2>
                <Link
                  to="/admin/tickets"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>

              {stats.recentTickets?.length === 0 ? (
                <EmptyState
                  title="No tickets submitted yet"
                  description="Tickets submitted by users will appear here."
                />
              ) : (
                <TicketTable
                  tickets={stats.recentTickets}
                  basePath="/admin/tickets"
                  showOwner
                />
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Activity
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                {!stats.recentActivities?.length ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No activity recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {stats.recentActivities.map((act) => (
                      <li key={act._id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-2.5">
                          <ActivityIcon className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-800">
                              {act.description}
                            </p>
                            {act.ticket?._id && !act.ticket.isDeleted ? (
                              <Link
                                to={`/admin/tickets/${act.ticket._id}`}
                                className="mt-0.5 block text-xs text-indigo-600 hover:text-indigo-700 truncate"
                              >
                                {act.ticket.title}
                              </Link>
                            ) : act.ticket?.title ? (
                              <span className="mt-0.5 block text-xs text-slate-400 truncate">
                                {act.ticket.title} (Deleted)
                              </span>
                            ) : null}
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {formatRelativeTime(act.createdAt)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </AppLayout>
  );
}
