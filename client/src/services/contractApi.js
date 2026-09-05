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
    const response = await apiClient.get(`/employees/${employeeId}/contracts`);
    return response.data;
  },

  async getActiveContract(employeeId) {
    const response = await apiClient.get(`/employees/${employeeId}/active-contract`);
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
};

export default contractApi;