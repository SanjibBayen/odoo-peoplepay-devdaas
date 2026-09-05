import apiClient from './apiClient.js';

export const auditLogApi = {
  async getAuditLogs(params = {}) {
    // Backend audit logs endpoint not implemented yet
    return { success: true, data: [], pending: true };
  },

  async createAuditLog(logData) {
    // Backend audit logs endpoint not implemented yet
    console.log('Audit log (not sent to backend):', logData);
    return { success: true };
  },
};

export default auditLogApi;