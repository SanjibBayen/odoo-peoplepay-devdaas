import apiClient from './apiClient.js';

export const payrunApi = {
  // ============ PAYRUN CRUD ============
  async getPayruns(params = {}) {
    const response = await apiClient.get('/payruns', { params });
    return response.data;
  },

  async getPayrunById(id) {
    const response = await apiClient.get(`/payruns/${id}`);
    return response.data;
  },

  async createPayrun(data) {
    const response = await apiClient.post('/payruns', data);
    return response.data;
  },

  // ============ PAYRUN WIZARD ============
  async getEligibleEmployees(id) {
    const response = await apiClient.get(`/payruns/${id}/eligible-employees`);
    return response.data;
  },

  async addEmployeesToPayrun(id, employeeIds) {
    const response = await apiClient.post(`/payruns/${id}/employees`, { employeeIds });
    return response.data;
  },

  // ============ PAYRUN PROCESSING ============
  async computePayrun(id) {
    const response = await apiClient.post(`/payruns/${id}/compute`);
    return response.data;
  },

  async validatePayrun(id) {
    const response = await apiClient.post(`/payruns/${id}/validate`);
    return response.data;
  },

  async markPayrunPaid(id, data = {}) {
    const response = await apiClient.post(`/payruns/${id}/mark-paid`, data);
    return response.data;
  },

  async sendPayslips(id) {
    const response = await apiClient.post(`/payruns/${id}/send-payslips`);
    return response.data;
  },

  async getPayrunWarnings(id) {
    const response = await apiClient.get(`/payruns/${id}/warnings`);
    return response.data;
  },

  // Aliases for backward compatibility
  async payPayrun(id, options) {
    return this.markPayrunPaid(id, options);
  },
};

export default payrunApi;
