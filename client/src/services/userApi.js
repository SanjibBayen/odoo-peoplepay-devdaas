import apiClient from './apiClient.js';

export const userApi = {
  async createUser(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async createEmployeeUser(userData) {
    const response = await apiClient.post('/auth/register-employee', userData);
    return response.data;
  },
};

export default userApi;