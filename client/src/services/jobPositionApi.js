import apiClient from './apiClient.js';

export const jobPositionApi = {
  async getJobPositions(params = {}) {
    const response = await apiClient.get('/job-positions', { params });
    return response.data;
  },

  async getJobPositionById(id) {
    const response = await apiClient.get(`/job-positions/${id}`);
    return response.data;
  },

  async getPositionsByDepartment(departmentId) {
    const response = await apiClient.get(`/job-positions/by-department/${departmentId}`);
    return response.data;
  },

  async createJobPosition(data) {
    const response = await apiClient.post('/job-positions', data);
    return response.data;
  },

  async updateJobPosition(id, data) {
    const response = await apiClient.put(`/job-positions/${id}`, data);
    return response.data;
  },

  async deleteJobPosition(id) {
    const response = await apiClient.delete(`/job-positions/${id}`);
    return response.data;
  },
};

export default jobPositionApi;
