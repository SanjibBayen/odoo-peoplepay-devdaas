import apiClient from './apiClient.js';

export const attendanceApi = {
  async getAttendance(params = {}) {
    const response = await apiClient.get('/attendance', { params });
    return response.data;
  },

  async getAttendanceById(id) {
    const response = await apiClient.get(`/attendance/${id}`);
    return response.data;
  },

  async getMyAttendance(params = {}) {
    const response = await apiClient.get('/attendance/my-attendance', { params });
    return response.data;
  },

  async getAttendanceSummary(params = {}) {
    const response = await apiClient.get('/attendance/summary', { params });
    return response.data;
  },

  async checkIn(data = {}) {
    const response = await apiClient.post('/attendance/check-in', data);
    return response.data;
  },

  async checkOut(data = {}) {
    const response = await apiClient.post('/attendance/check-out', data);
    return response.data;
  },

  async createManualEntry(data) {
    const response = await apiClient.post('/attendance/manual-entry', data);
    return response.data;
  },

  async correctAttendance(id, data) {
    const response = await apiClient.put(`/attendance/${id}/correct`, data);
    return response.data;
  },

  // Backward compatibility aliases
  async getAttendanceByEmployee(employeeId, params = {}) {
    return this.getAttendance({ ...params, employeeId });
  },

  async updateAttendance(id, data) {
    return this.correctAttendance(id, data);
  },
};

export default attendanceApi;
