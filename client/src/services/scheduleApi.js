import apiClient from './apiClient.js';

export const scheduleApi = {
  async getSchedules(params = {}) {
    const response = await apiClient.get('/work-schedules', { params });
    return response.data;
  },

  async getScheduleById(id) {
    const response = await apiClient.get(`/work-schedules/${id}`);
    return response.data;
  },

  async createSchedule(data) {
    const response = await apiClient.post('/work-schedules', data);
    return response.data;
  },

  async updateSchedule(id, data) {
    const response = await apiClient.put(`/work-schedules/${id}`, data);
    return response.data;
  },

  async deleteSchedule(id) {
    const response = await apiClient.delete(`/work-schedules/${id}`);
    return response.data;
  },

  async updateScheduleDays(id, days) {
    const response = await apiClient.put(`/work-schedules/${id}/days`, { days });
    return response.data;
  },
};

export default scheduleApi;