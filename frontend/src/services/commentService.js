import api from './api';

export const commentService = {
  async getComments(ticketId) {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    return response.data.data.comments;
  },

  async addComment(ticketId, message) {
    const response = await api.post(`/tickets/${ticketId}/comments`, { message });
    return response.data.data.comment;
  },
};
