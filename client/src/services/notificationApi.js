import { apiClient } from './apiClient.js';

export const notificationApi = {
  /**
   * Fetch current user's notifications
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },
};

export default notificationApi;
