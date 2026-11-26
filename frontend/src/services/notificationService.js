import api from './api';

export const notificationService = {
  async listNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data.notification;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },
};
