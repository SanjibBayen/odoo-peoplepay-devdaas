import apiClient from './apiClient.js';

export const auditLogApi = {
  async getAuditLogs(params = {}) {
    try {
      const response = await apiClient.get('/audit-logs', { params });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: [], pending: true };
      }
      throw error;
    }
  },

  async createAuditLog(logData) {
    const response = await apiClient.post('/audit-logs', logData);
    return response.data;
  },
};

export default auditLogApi;
