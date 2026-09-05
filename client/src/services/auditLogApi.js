import apiClient from './apiClient.js';
import { INITIAL_AUDIT_LOGS } from '../data/adminData.js';

export const auditLogApi = {
  async getAuditLogs(params = {}) {
    try {
      const response = await apiClient.get('/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /audit-logs unavailable, using local mock.', error.message);
      return { success: true, data: INITIAL_AUDIT_LOGS, total: INITIAL_AUDIT_LOGS.length };
    }
  },

  async createAuditLog(logData) {
    try {
      const response = await apiClient.post('/audit-logs', logData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /audit-logs unavailable', error.message);
      const newLog = {
        ...logData,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'SUCCESS',
      };
      return { success: true, data: newLog };
    }
  },
};

export default auditLogApi;
