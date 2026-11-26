import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  FolderOpen,
  Lock,
  PlusCircle,
  Ticket as TicketIcon,
} from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { StatCard } from '../../components/common/StatCard';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '../../components/common/States';
import { TicketTable } from '../../components/tickets/TicketTable';
import { TicketCharts } from '../../components/dashboard/TicketCharts';
import { dashboardService } from '../../services/dashboardService';
import { getApiErrorMessage } from '../../utils/formatters';

export function UserDashboardPage() {
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
      setError(getApiErrorMessage(err, 'Failed to load dashboard statistics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <AppLayout
      title="Support Overview"
      breadcrumbs={[{ label: 'Dashboard' }]}
      actions={
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Ticket
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

          {stats.totalTickets > 0 && (
            <TicketCharts
              statusDistribution={stats.statusDistribution}
              priorityDistribution={stats.priorityDistribution}
            />
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Tickets</h2>
              <Link
                to="/tickets"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all tickets
              </Link>
            </div>

            {stats.recentTickets?.length === 0 ? (
              <EmptyState
                title="No tickets submitted yet"
                description="Need help with an issue or question? Create your first support ticket."
                action={
                  <Link
                    to="/tickets/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Ticket
                  </Link>
                }
              />
            ) : (
              <TicketTable tickets={stats.recentTickets} basePath="/tickets" />
            )}
          </section>
        </>
      )}
    </AppLayout>
  );
}
