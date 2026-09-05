import apiClient from './apiClient.js';
import { INITIAL_USERS } from '../data/adminData.js';

export const userApi = {
  async getUsers(params = {}) {
    try {
      const response = await apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /users unavailable, using local mock.', error.message);
      return { success: true, data: INITIAL_USERS, total: INITIAL_USERS.length };
    }
  },

  async getUserById(id) {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /users/${id} unavailable`, error.message);
      const found = INITIAL_USERS.find((u) => u.id === id);
      return { success: true, data: found || null };
    }
  },

  async createUser(userData) {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /users unavailable', error.message);
      const newUser = {
        ...userData,
        id: `usr-${Date.now()}`,
        status: userData.status || 'Active',
        lastActive: 'Just now',
      };
      return { success: true, data: newUser };
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /users/${id} unavailable`, error.message);
      return { success: true, data: { ...userData, id } };
    }
  },

  async deleteUser(id) {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /users/${id} unavailable`, error.message);
      return { success: true, message: 'User deleted' };
    }
  },
};

export default userApi;
