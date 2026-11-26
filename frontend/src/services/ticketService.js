import api from './api';

export const ticketService = {
  async createTicket(payload) {
    const response = await api.post('/tickets', payload);
    return response.data.data.ticket;
  },

  async listTickets(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
    );
    const response = await api.get('/tickets', { params: cleanParams });
    return response.data.data;
  },

  async getTicketById(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data.data.ticket;
  },

  async updateTicket(id, payload) {
    const response = await api.patch(`/tickets/${id}`, payload);
    return response.data.data.ticket;
  },

  async deleteTicket(id) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/admin/tickets/${id}/status`, { status });
    return response.data.data.ticket;
  },

  async updatePriority(id, priority) {
    const response = await api.patch(`/admin/tickets/${id}/priority`, { priority });
    return response.data.data.ticket;
  },

  async getActivities(id) {
    const response = await api.get(`/tickets/${id}/activities`);
    return response.data.data.activities;
  },
};
