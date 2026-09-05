import apiClient from './apiClient.js';
import {
  getAttendanceFromStorage,
  saveAttendanceToStorage,
} from '../data/attendanceData.js';

export const attendanceApi = {
  async getAttendance(params = {}) {
    try {
      const response = await apiClient.get('/attendance', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /attendance unavailable, using mock store.', error.message);
      let data = getAttendanceFromStorage();
      if (params.employeeId) {
        data = data.filter((a) => a.employeeId === params.employeeId);
      }
      if (params.status && params.status !== 'All' && params.status !== 'All Statuses') {
        data = data.filter((a) => a.status === params.status);
      }
      if (params.date) {
        data = data.filter((a) => a.date === params.date);
      }
      return { success: true, data, total: data.length };
    }
  },

  async getAttendanceByEmployee(id) {
    return this.getAttendance({ employeeId: id });
  },

  async checkIn({ employeeId, checkInTime, notes }) {
    try {
      const response = await apiClient.post('/attendance/check-in', {
        employeeId,
        checkInTime,
        notes,
      });
      return response.data;
    } catch (error) {
      console.warn('Backend POST /attendance/check-in unavailable, logging locally.', error.message);
      const current = getAttendanceFromStorage();
      const today = new Date().toISOString().split('T')[0];
      const newPunch = {
        id: `att-${Date.now()}`,
        employeeId: employeeId || 'EMP-2024-001',
        employeeName: 'Ayush Sharma',
        department: 'Engineering',
        date: today,
        checkIn: checkInTime || '09:00',
        checkOut: null,
        workedHours: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        status: 'PRESENT',
        notes: notes || 'Web check-in',
      };
      saveAttendanceToStorage([newPunch, ...current]);
      return { success: true, data: newPunch };
    }
  },

  async checkOut({ attendanceId, checkOutTime, notes }) {
    try {
      const response = await apiClient.post('/attendance/check-out', {
        attendanceId,
        checkOutTime,
        notes,
      });
      return response.data;
    } catch (error) {
      console.warn('Backend POST /attendance/check-out unavailable', error.message);
      const current = getAttendanceFromStorage();
      const record = current[0];
      if (record) {
        record.checkOut = checkOutTime || '18:00';
        record.workedHours = 8.0;
        record.notes = notes || record.notes;
        saveAttendanceToStorage([...current]);
        return { success: true, data: record };
      }
      return { success: false, message: 'Record not found' };
    }
  },

  async updateAttendance(id, updatedData) {
    try {
      const response = await apiClient.put(`/attendance/${id}`, updatedData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /attendance/${id} unavailable`, error.message);
      const current = getAttendanceFromStorage();
      const index = current.findIndex((a) => a.id === id);
      if (index >= 0) {
        current[index] = { ...current[index], ...updatedData };
        saveAttendanceToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Record not found' };
    }
  },

  async correctAttendance(id, updatedData) {
    return this.updateAttendance(id, updatedData);
  },
};

export default attendanceApi;
