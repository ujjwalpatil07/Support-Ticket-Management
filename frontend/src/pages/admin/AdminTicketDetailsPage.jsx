import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, RotateCcw, Trash2, User as UserIcon } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import {
  CategoryBadge,
  PriorityBadge,
  StatusBadge,
} from '../../components/common/Badges';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { ErrorState, LoadingSkeleton } from '../../components/common/States';
import { CommentSection } from '../../components/comments/CommentSection';
import { ActivityTimeline } from '../../components/tickets/ActivityTimeline';
import { ticketService } from '../../services/ticketService';
import { commentService } from '../../services/commentService';
import {
  ALLOWED_STATUS_TRANSITIONS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '../../utils/constants';
import { formatDateTime, getApiErrorMessage } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export function AdminTicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [priorityUpdating, setPriorityUpdating] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Other',
    description: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadTicketDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketData, commentsData, activitiesData] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getComments(id),
        ticketService.getActivities(id),
      ]);
      setTicket(ticketData);
      setComments(commentsData || []);
      setActivities(activitiesData || []);
      setEditForm({
        title: ticketData.title,
        category: ticketData.category,
        description: ticketData.description,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load ticket details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicketDetails();
  }, [loadTicketDetails]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await ticketService.updateStatus(id, newStatus);
      toast.success(`Ticket status updated to "${newStatus}".`);
      await loadTicketDetails();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update ticket status.'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (newPriority === ticket.priority) return;
    setPriorityUpdating(true);
    try {
      await ticketService.updatePriority(id, newPriority);
      toast.success(`Ticket priority updated to "${newPriority}".`);
      await loadTicketDetails();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update ticket priority.'));
    } finally {
      setPriorityUpdating(false);
    }
  };

  const handleAddComment = async (message) => {
    setCommentSubmitting(true);
    try {
      await commentService.addComment(id, message);
      toast.success('Reply posted.');
      await loadTicketDetails();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to post reply.'));
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await ticketService.updateTicket(id, {
        title: editForm.title.trim(),
        category: editForm.category,
        description: editForm.description.trim(),
      });
      toast.success('Ticket details updated.');
      setEditOpen(false);
      await loadTicketDetails();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update ticket.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteSubmitting(true);
    try {
      await ticketService.deleteTicket(id);
      toast.success('Ticket deleted successfully.');
      navigate('/admin/tickets', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete ticket.'));
      setDeleteSubmitting(false);
    }
  };

  const allowedTransitions = ticket
    ? ALLOWED_STATUS_TRANSITIONS[ticket.status] || []
    : [];

  return (
    <AppLayout
      title={ticket ? ticket.title : 'Ticket Details'}
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'All Tickets', to: '/admin/tickets' },
        { label: ticket ? 'Manage Ticket' : 'Loading...' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/tickets')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {ticket && (
            <>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit Details
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-white border border-rose-300 rounded-md hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      }
    >
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTicketDetails} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>

              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
              submitting={commentSubmitting}
            />
          </div>

          <div className="space-y-6">
            {/* Admin Controls */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-5">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Admin Controls
              </h2>

              <div>
                <label
                  htmlFor="admin-priority"
                  className="block text-xs font-medium text-slate-600 mb-1.5"
                >
                  Priority Level
                </label>
                <select
                  id="admin-priority"
                  value={ticket.priority}
                  disabled={priorityUpdating}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-600 mb-2">
                  Status Transitions (Current: {ticket.status})
                </span>
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((nextStatus) => {
                    const isReopen =
                      (ticket.status === 'Resolved' && nextStatus === 'In Progress') ||
                      (ticket.status === 'Closed' && nextStatus === 'Open');

                    return (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(nextStatus)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 ${
                          nextStatus === 'Resolved'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : isReopen
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isReopen && <RotateCcw className="h-3.5 w-3.5" />}
                        {isReopen ? `Reopen (${nextStatus})` : `Move to ${nextStatus}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submitter Details */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  Ticket Owner
                </h2>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {ticket.createdBy?.name || 'Unknown'}
                </p>
                <p className="text-slate-500">{ticket.createdBy?.email || '—'}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(ticket.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span className="font-medium text-slate-800">
                    {formatDateTime(ticket.updatedAt)}
                  </span>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex justify-between">
                    <span>Resolved</span>
                    <span className="font-medium text-emerald-700">
                      {formatDateTime(ticket.resolvedAt)}
                    </span>
                  </div>
                )}
                {ticket.closedAt && (
                  <div className="flex justify-between">
                    <span>Closed</span>
                    <span className="font-medium text-slate-800">
                      {formatDateTime(ticket.closedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ActivityTimeline activities={activities} />
          </div>
        </div>
      )}

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Ticket Details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-edit-title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Title
            </label>
            <input
              id="admin-edit-title"
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="admin-edit-category"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Category
            </label>
            <select
              id="admin-edit-category"
              value={editForm.category}
              onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-edit-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="admin-edit-description"
              rows={5}
              required
              minLength={5}
              maxLength={5000}
              value={editForm.description}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Soft-Delete Ticket"
        message="Are you sure you want to archive/soft-delete this ticket? It will no longer appear in active queues."
        confirmLabel="Delete Ticket"
        loading={deleteSubmitting}
      />
    </AppLayout>
  );
}
