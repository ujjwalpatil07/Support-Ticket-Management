import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

export function NotificationDropdown() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const notificationsPath = isAdmin ? '/admin/notifications' : '/notifications';
  const ticketBasePath = isAdmin ? '/admin/tickets' : '/tickets';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silent background poll failure
    }
  }, []);

  const fetchDropdownNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.listNotifications({ page: 1, limit: 6 });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      fetchDropdownNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore transient error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore transient error
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Notifications"
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-slate-200 shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 space-y-3 animate-pulse">
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                You are all caught up. No notifications yet.
              </div>
            ) : (
              items.map((notif) => (
                <div
                  key={notif._id}
                  className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                    !notif.isRead ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.ticket?._id && !notif.ticket.isDeleted && (
                      <Link
                        to={`${ticketBasePath}/${notif.ticket._id}`}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif._id);
                          setOpen(false);
                        }}
                        className="mt-1.5 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View ticket
                      </Link>
                    )}
                  </div>

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif._id)}
                      title="Mark as read"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-center">
            <Link
              to={notificationsPath}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
