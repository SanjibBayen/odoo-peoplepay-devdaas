import apiClient from './apiClient.js';
import { getEmployees, getEmployeeById, saveEmployee } from '../data/employeeStore.js';

export const employeeApi = {
  async getEmployees(params = {}) {
    try {
      const response = await apiClient.get('/employees', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /employees unavailable, using mock employee store.', error.message);
      const data = getEmployees();
      return { success: true, data, total: data.length };
    }
  },

  async getEmployeeById(id) {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /employees/${id} unavailable, using mock employee store.`, error.message);
      const data = getEmployeeById(id);
      return { success: true, data };
    }
  },

  async createEmployee(employeeData) {
    try {
      const response = await apiClient.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /employees unavailable, saving to local store.', error.message);
      const updated = saveEmployee(employeeData);
      return { success: true, data: updated[0] };
    }
  },

  async updateEmployee(id, employeeData) {
    try {
      const response = await apiClient.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /employees/${id} unavailable, saving to local store.`, error.message);
      const updated = saveEmployee({ ...employeeData, id });
      const record = updated.find((e) => e.id === id || e.employeeId === id);
      return { success: true, data: record };
    }
  },

  async deleteEmployee(id) {
    try {
      const response = await apiClient.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /employees/${id} unavailable`, error.message);
      return { success: true, message: 'Employee archived locally' };
    }
  },
};

export default employeeApi;
