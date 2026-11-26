import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { SearchAndFilters } from '../../components/common/SearchAndFilters';
import { TicketTable } from '../../components/tickets/TicketTable';
import { Pagination } from '../../components/common/Pagination';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/common/States';
import { ticketService } from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/formatters';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  priority: '',
  category: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

export function UserTicketsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketService.listTickets({
        ...filters,
        search: debouncedSearch,
      });
      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tickets.'));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.status,
    filters.priority,
    filters.category,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      if (field === 'sort') {
        return { ...prev, sortBy: value.sortBy, sortOrder: value.sortOrder, page: 1 };
      }
      return { ...prev, [field]: value, page: 1 };
    });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch('');
  };

  return (
    <AppLayout
      title="My Tickets"
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'My Tickets' },
      ]}
      actions={
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Ticket
        </Link>
      }
    >
      <SearchAndFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No matching tickets found"
          description="Try adjusting your search or filter criteria, or submit a new support ticket."
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
        <div>
          <TicketTable tickets={tickets} basePath="/tickets" />
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </div>
      )}
    </AppLayout>
  );
}
