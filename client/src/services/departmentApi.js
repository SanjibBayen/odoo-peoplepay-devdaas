import apiClient from './apiClient.js';
import { INITIAL_DEPARTMENTS } from '../data/adminData.js';

export const departmentApi = {
  async getDepartments() {
    try {
      const response = await apiClient.get('/departments');
      return response.data;
    } catch (error) {
      console.warn('Backend /departments unavailable, using local mock.', error.message);
      return { success: true, data: INITIAL_DEPARTMENTS };
    }
  },

  async getDepartmentById(id) {
    try {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /departments/${id} unavailable`, error.message);
      const found = INITIAL_DEPARTMENTS.find((d) => d.id === id);
      return { success: true, data: found || null };
    }
  },

  async createDepartment(deptData) {
    try {
      const response = await apiClient.post('/departments', deptData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /departments unavailable', error.message);
      const newDept = {
        ...deptData,
        id: `dept-${Date.now()}`,
        headCount: 0,
      };
      return { success: true, data: newDept };
    }
  },

  async updateDepartment(id, deptData) {
    try {
      const response = await apiClient.put(`/departments/${id}`, deptData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /departments/${id} unavailable`, error.message);
      return { success: true, data: { ...deptData, id } };
    }
  },

  async deleteDepartment(id) {
    try {
      const response = await apiClient.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /departments/${id} unavailable`, error.message);
      return { success: true, message: `Department ${id} deleted` };
    }
  },
};

export default departmentApi;
