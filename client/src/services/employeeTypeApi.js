import apiClient from './apiClient.js';

export const employeeTypeApi = {
  async getEmployeeTypes(params = {}) {
    const response = await apiClient.get('/employee-types', { params });
    return response.data;
  },

  async getEmployeeTypeById(id) {
    const response = await apiClient.get(`/employee-types/${id}`);
    return response.data;
  },

  async createEmployeeType(data) {
    const response = await apiClient.post('/employee-types', data);
    return response.data;
  },

  async updateEmployeeType(id, data) {
    const response = await apiClient.put(`/employee-types/${id}`, data);
    return response.data;
  },

  async deleteEmployeeType(id) {
    const response = await apiClient.delete(`/employee-types/${id}`);
    return response.data;
  },
};

export default employeeTypeApi;
