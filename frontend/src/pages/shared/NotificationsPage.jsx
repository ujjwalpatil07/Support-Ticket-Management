import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { Pagination } from '../../components/common/Pagination';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '../../components/common/States';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime, getApiErrorMessage } from '../../utils/formatters';

export function NotificationsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
  const ticketBasePath = isAdmin ? '/admin/tickets' : '/tickets';

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationService.listNotifications({
        page,
        limit: 15,
        unreadOnly: unreadOnly ? 'true' : undefined,
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marked as read.');
      await fetchNotifications();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update notification.'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All notifications marked as read.');
      await fetchNotifications();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to mark notifications as read.'));
    }
  };

  return (
    <AppLayout
      title="Notifications"
      breadcrumbs={[
        { label: 'Dashboard', to: dashboardPath },
        { label: 'Notifications' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUnreadOnly((prev) => !prev);
              setPage(1);
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
              unreadOnly
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {unreadOnly ? 'Showing Unread' : 'Show Unread Only'}
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description={
            unreadOnly
              ? 'You have read all of your notifications.'
              : 'Updates on ticket creation, comments, and status changes will appear here.'
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {notifications.map((item) => (
              <li
                key={item._id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !item.isRead ? 'bg-indigo-50/40' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{item.message}</p>
                  {item.ticket?._id && !item.ticket.isDeleted ? (
                    <Link
                      to={`${ticketBasePath}/${item.ticket._id}`}
                      className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-0.5"
                    >
                      Open Ticket ({item.ticket.status})
                    </Link>
                  ) : item.ticket?.isDeleted ? (
                    <span className="inline-block text-xs text-slate-400 pt-0.5">
                      Ticket deleted
                    </span>
                  ) : null}
                </div>

                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 self-start sm:self-center shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </AppLayout>
  );
}
