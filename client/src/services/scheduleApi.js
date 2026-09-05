import apiClient from './apiClient.js';
import {
  calculateWeeklyHours,
  getSchedulesFromStorage,
  saveSchedulesToStorage,
} from '../data/schedulesData.js';

export const scheduleApi = {
  async getSchedules() {
    try {
      const response = await apiClient.get('/schedules');
      return response.data;
    } catch (error) {
      console.warn('Backend /schedules unavailable, using local mock.', error.message);
      const data = getSchedulesFromStorage();
      return { success: true, data };
    }
  },

  async getScheduleById(id) {
    try {
      const response = await apiClient.get(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /schedules/${id} unavailable`, error.message);
      const all = getSchedulesFromStorage();
      const found = all.find((s) => s.id === id);
      return { success: true, data: found || null };
    }
  },

  async createSchedule(scheduleData) {
    // Automatically calculate weekly hours from day breakdown
    const weeklyHours = calculateWeeklyHours(scheduleData.days);
    const payload = { ...scheduleData, weeklyHours };

    try {
      const response = await apiClient.post('/schedules', payload);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /schedules unavailable, saving locally.', error.message);
      const current = getSchedulesFromStorage();
      const newSchedule = {
        ...payload,
        id: `sch-${Date.now()}`,
        assignedEmployeesCount: 0,
      };
      saveSchedulesToStorage([newSchedule, ...current]);
      return { success: true, data: newSchedule };
    }
  },

  async updateSchedule(id, scheduleData) {
    const weeklyHours = calculateWeeklyHours(scheduleData.days);
    const payload = { ...scheduleData, weeklyHours };

    try {
      const response = await apiClient.put(`/schedules/${id}`, payload);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /schedules/${id} unavailable`, error.message);
      const current = getSchedulesFromStorage();
      const index = current.findIndex((s) => s.id === id);
      if (index >= 0) {
        current[index] = { ...current[index], ...payload };
        saveSchedulesToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Schedule not found' };
    }
  },

  async deleteSchedule(id) {
    try {
      const response = await apiClient.delete(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /schedules/${id} unavailable`, error.message);
      const current = getSchedulesFromStorage();
      const filtered = current.filter((s) => s.id !== id);
      saveSchedulesToStorage(filtered);
      return { success: true, message: `Schedule ${id} removed` };
    }
  },
};

export default scheduleApi;
