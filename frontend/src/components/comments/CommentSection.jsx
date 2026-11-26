import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { RoleBadge } from '../common/Badges';
import { formatDateTime } from '../../utils/formatters';

export function CommentSection({ comments = [], onAddComment, submitting = false }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please enter a comment before submitting.');
      return;
    }
    if (trimmed.length > 2000) {
      setError('Comment cannot exceed 2000 characters.');
      return;
    }

    setError('');
    const ok = await onAddComment(trimmed);
    if (ok) {
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">
            Comments ({comments.length})
          </h2>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            No comments yet. Start the conversation below.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isAdminAuthor = comment.author?.role === 'admin';
              return (
                <div
                  key={comment._id}
                  className={`rounded-lg border p-4 ${
                    isAdminAuthor
                      ? 'border-indigo-100 bg-indigo-50/30'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {comment.author?.name || 'Unknown User'}
                      </span>
                      <RoleBadge role={comment.author?.role || 'user'} />
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {comment.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-200">
          <label
            htmlFor="comment-message"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Add a comment
          </label>
          <textarea
            id="comment-message"
            rows={3}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            placeholder="Write a reply or update..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{message.length}/2000</span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
