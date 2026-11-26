import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
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
import { TICKET_CATEGORIES } from '../../utils/constants';
import { formatDateTime, getApiErrorMessage } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export function UserTicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleAddComment = async (message) => {
    setCommentSubmitting(true);
    try {
      await commentService.addComment(id, message);
      toast.success('Comment posted.');
      await loadTicketDetails();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to post comment.'));
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
      toast.success('Ticket updated successfully.');
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
      navigate('/tickets', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete ticket.'));
      setDeleteSubmitting(false);
    }
  };

  const canModify = ticket?.status === 'Open';

  return (
    <AppLayout
      title={ticket ? ticket.title : 'Ticket Details'}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'My Tickets', to: '/tickets' },
        { label: ticket ? 'Details' : 'Loading...' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {canModify && (
            <>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit
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

              {!canModify && (
                <p className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                  Editing and deletion are disabled because this ticket is currently{' '}
                  <span className="font-semibold">{ticket.status}</span>.
                </p>
              )}
            </div>

            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
              submitting={commentSubmitting}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Ticket Information
              </h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <StatusBadge status={ticket.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Priority</dt>
                  <dd>
                    <PriorityBadge priority={ticket.priority} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium text-slate-800">{ticket.category}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-700">{formatDateTime(ticket.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Last Updated</dt>
                  <dd className="text-slate-700">{formatDateTime(ticket.updatedAt)}</dd>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Resolved</dt>
                    <dd className="text-emerald-700 font-medium">
                      {formatDateTime(ticket.resolvedAt)}
                    </dd>
                  </div>
                )}
                {ticket.closedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Closed</dt>
                    <dd className="text-slate-700">{formatDateTime(ticket.closedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <ActivityTimeline activities={activities} />
          </div>
        </div>
      )}

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Ticket"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Title
            </label>
            <input
              id="edit-title"
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
              htmlFor="edit-category"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Category
            </label>
            <select
              id="edit-category"
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
              htmlFor="edit-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="edit-description"
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
        title="Delete Support Ticket"
        message="Are you sure you want to delete this ticket? It will be removed from your active ticket list."
        confirmLabel="Delete Ticket"
        loading={deleteSubmitting}
      />
    </AppLayout>
  );
}
