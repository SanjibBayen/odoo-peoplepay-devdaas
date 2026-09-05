import apiClient from './apiClient.js';

export const contractApi = {
  async getContracts(params = {}) {
    const response = await apiClient.get('/contracts', { params });
    return response.data;
  },

  async getContractById(id) {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  },

  async getContractsByEmployee(employeeId) {
    const response = await apiClient.get(`/contracts/employee/${employeeId}`);
    return response.data;
  },

  async getActiveContract(employeeId) {
    const response = await apiClient.get(`/contracts/active/${employeeId}`);
    return response.data;
  },

  async createContract(data) {
    const response = await apiClient.post('/contracts', data);
    return response.data;
  },

  async updateContract(id, data) {
    const response = await apiClient.put(`/contracts/${id}`, data);
    return response.data;
  },

  async deleteContract(id) {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  },

  async terminateContract(id, data = {}) {
    const response = await apiClient.post(`/contracts/${id}/terminate`, data);
    return response.data;
  },

  async activateContract(id) {
    const response = await apiClient.post(`/contracts/${id}/activate`);
    return response.data;
  },

  // Alias for compatibility
  async archiveContract(id) {
    return this.terminateContract(id);
  },
};

export default contractApi;
