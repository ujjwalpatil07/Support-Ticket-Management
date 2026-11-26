import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../utils/constants';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../hooks/useToast';
import { getApiErrorMessage } from '../../utils/formatters';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    category: 'Technical Issue',
    priority: 'Medium',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (form.description.trim().length < 5) {
      setError('Description must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const ticket = await ticketService.createTicket({
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
      });
      toast.success('Support ticket submitted successfully.');
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Create Support Ticket"
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'My Tickets', to: '/tickets' },
        { label: 'New Ticket' },
      ]}
      actions={
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="max-w-3xl bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Subject / Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              value={form.title}
              onChange={handleChange}
              placeholder="Brief summary of the issue or request"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                htmlFor="priority"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Initial Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Detailed Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              maxLength={5000}
              value={form.description}
              onChange={handleChange}
              placeholder="Include steps to reproduce, expected behavior, and any relevant error messages..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              {form.description.length}/5000 characters
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
