import { useCallback, useEffect, useState } from 'react';
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

export function AdminTicketsPage() {
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
      title="All Support Tickets"
      breadcrumbs={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'All Tickets' },
      ]}
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
          title="No tickets match your criteria"
          description="Try clearing or adjusting your search and filter options."
        />
      ) : (
        <div>
          <TicketTable
            tickets={tickets}
            basePath="/admin/tickets"
            showOwner
          />
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </div>
      )}
    </AppLayout>
  );
}
