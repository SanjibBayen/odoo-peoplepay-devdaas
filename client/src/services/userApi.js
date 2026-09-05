import apiClient from './apiClient.js';

export const userApi = {
  async getUsers(params = {}) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getUserById(id) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async createUser(userData) {
    // Backend registration route
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async createEmployeeUser(userData) {
    const response = await apiClient.post('/auth/register-employee', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

export default userApi;
