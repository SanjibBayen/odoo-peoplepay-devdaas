import apiClient from './apiClient.js';

export const departmentApi = {
  async getDepartments(params = {}) {
    const response = await apiClient.get('/departments', { params });
    return response.data;
  },

  async getDepartmentHierarchy() {
    const response = await apiClient.get('/departments/hierarchy');
    return response.data;
  },

  async getDepartmentById(id) {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  async getDepartmentEmployees(id, params = {}) {
    const response = await apiClient.get(`/departments/${id}/employees`, { params });
    return response.data;
  },

  async createDepartment(deptData) {
    const response = await apiClient.post('/departments', deptData);
    return response.data;
  },

  async updateDepartment(id, deptData) {
    const response = await apiClient.put(`/departments/${id}`, deptData);
    return response.data;
  },

  async deleteDepartment(id) {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },
};

export default departmentApi;
