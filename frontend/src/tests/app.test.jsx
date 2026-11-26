import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
import { authService } from '../services/authService';
import { ticketService } from '../services/ticketService';
import { dashboardService } from '../services/dashboardService';
import { notificationService } from '../services/notificationService';
import { commentService } from '../services/commentService';

vi.mock('../services/authService', () => ({
  authService: {
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/ticketService', () => ({
  ticketService: {
    listTickets: vi.fn(),
    createTicket: vi.fn(),
    getTicketById: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    getActivities: vi.fn(),
  },
}));

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getStats: vi.fn(),
  },
}));

vi.mock('../services/notificationService', () => ({
  notificationService: {
    listNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock('../services/commentService', () => ({
  commentService: {
    getComments: vi.fn(),
    addComment: vi.fn(),
  },
}));

describe('Frontend Authentication, Role Navigation & Workflows', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.history.pushState({}, '', '/login');
    notificationService.getUnreadCount.mockResolvedValue(0);
    notificationService.listNotifications.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
  });

  it('validates and logs in a standard user to /dashboard', async () => {
    authService.getMe.mockRejectedValueOnce(new Error('Unauthenticated'));
    authService.login.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Alice User',
      email: 'alice@example.com',
      role: 'user',
      isActive: true,
    });
    dashboardService.getStats.mockResolvedValueOnce({
      totalTickets: 2,
      openTickets: 1,
      inProgressTickets: 1,
      resolvedTickets: 0,
      closedTickets: 0,
      statusDistribution: [],
      priorityDistribution: [],
      recentTickets: [],
    });

    render(<App />);

    expect(await screen.findByText(/Sign in to ResolveDesk/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Email and password are required/i);

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Support Overview/i)).toBeInTheDocument();
    });
    expect(screen.getByText('My Tickets')).toBeInTheDocument();
    expect(screen.queryByText('All Tickets')).not.toBeInTheDocument();
  });

  it('validates registration and redirects user to dashboard', async () => {
    window.history.pushState({}, '', '/register');
    authService.getMe.mockRejectedValueOnce(new Error('Unauthenticated'));
    authService.register.mockResolvedValueOnce({
      _id: 'u2',
      name: 'Bob Builder',
      email: 'bob@example.com',
      role: 'user',
      isActive: true,
    });
    dashboardService.getStats.mockResolvedValueOnce({
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      statusDistribution: [],
      priorityDistribution: [],
      recentTickets: [],
    });

    render(<App />);

    expect(await screen.findByText(/Create your account/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: 'Bob Builder' },
    });
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'bob@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: 'Different123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Passwords do not match/i);

    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: 'Password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'Bob Builder',
        email: 'bob@example.com',
        password: 'Password123',
      });
      expect(screen.getByText(/Support Overview/i)).toBeInTheDocument();
    });
  });

  it('redirects regular user away from admin routes', async () => {
    window.history.pushState({}, '', '/admin/dashboard');
    authService.getMe.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Alice User',
      email: 'alice@example.com',
      role: 'user',
      isActive: true,
    });
    dashboardService.getStats.mockResolvedValueOnce({
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      statusDistribution: [],
      priorityDistribution: [],
      recentTickets: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Support Overview/i)).toBeInTheDocument();
    });
  });

  it('displays loading, error, empty, and populated ticket list states', async () => {
    window.history.pushState({}, '', '/tickets');
    authService.getMe.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Alice User',
      email: 'alice@example.com',
      role: 'user',
      isActive: true,
    });
    ticketService.listTickets
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce({
        tickets: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        tickets: [
          {
            _id: 't1',
            title: 'VPN disconnects frequently',
            description: 'Drops every 10 minutes on macOS',
            category: 'Technical Issue',
            priority: 'High',
            status: 'Open',
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

    render(<App />);

    expect(await screen.findByText(/Unable to load data/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText(/No matching tickets found/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Filter by status/i), {
      target: { value: 'Open' },
    });
    expect(await screen.findAllByText('VPN disconnects frequently')).toHaveLength(2);
  });

  it('submits a new support ticket via CreateTicketPage', async () => {
    window.history.pushState({}, '', '/tickets/new');
    authService.getMe.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Alice User',
      email: 'alice@example.com',
      role: 'user',
      isActive: true,
    });
    ticketService.createTicket.mockResolvedValueOnce({
      _id: 't99',
      title: 'Two-factor SMS delayed',
      description: 'Verification SMS arrives after 10 minutes.',
      category: 'Account Issue',
      priority: 'High',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    ticketService.getTicketById.mockResolvedValueOnce({
      _id: 't99',
      title: 'Two-factor SMS delayed',
      description: 'Verification SMS arrives after 10 minutes.',
      category: 'Account Issue',
      priority: 'High',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    commentService.getComments.mockResolvedValueOnce([]);
    ticketService.getActivities.mockResolvedValueOnce([]);

    render(<App />);

    expect(await screen.findByText(/Create Support Ticket/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Subject \/ Title/i), {
      target: { value: 'Two-factor SMS delayed' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'Account Issue' },
    });
    fireEvent.change(screen.getByLabelText(/Initial Priority/i), {
      target: { value: 'High' },
    });
    fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
      target: { value: 'Verification SMS arrives after 10 minutes.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(ticketService.createTicket).toHaveBeenCalledWith({
        title: 'Two-factor SMS delayed',
        category: 'Account Issue',
        priority: 'High',
        description: 'Verification SMS arrives after 10 minutes.',
      });
    });
  });

  it('renders admin ticket details with valid status transition controls and comment posting', async () => {
    window.history.pushState({}, '', '/admin/tickets/t100');
    authService.getMe.mockResolvedValueOnce({
      _id: 'a1',
      name: 'Admin Lead',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true,
    });
    ticketService.getTicketById.mockResolvedValue({
      _id: 't100',
      title: 'Payment gateway timeout',
      description: 'Stripe webhook returns 504 intermittently',
      category: 'Payment Issue',
      priority: 'High',
      status: 'In Progress',
      createdBy: { _id: 'u1', name: 'Jane Doe', email: 'jane@example.com' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    commentService.getComments.mockResolvedValue([]);
    ticketService.getActivities.mockResolvedValue([]);
    ticketService.updateStatus.mockResolvedValue({ status: 'Resolved' });
    commentService.addComment.mockResolvedValue({
      _id: 'c1',
      message: 'Investigating logs.',
    });

    render(<App />);

    expect(await screen.findByText('Payment gateway timeout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Move to Resolved/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Move to Open/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Move to Resolved/i }));
    await waitFor(() => {
      expect(ticketService.updateStatus).toHaveBeenCalledWith('t100', 'Resolved');
    });

    fireEvent.change(screen.getByLabelText(/Add a comment/i), {
      target: { value: 'Investigating logs.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Post Comment/i }));
    await waitFor(() => {
      expect(commentService.addComment).toHaveBeenCalledWith(
        't100',
        'Investigating logs.'
      );
    });
  });
});
