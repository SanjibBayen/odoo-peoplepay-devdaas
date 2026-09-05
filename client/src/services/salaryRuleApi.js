import apiClient from './apiClient.js';

export const salaryRuleApi = {
  async getSalaryRules(params = {}) {
    const response = await apiClient.get('/salary-rules', { params });
    return response.data;
  },

  async getSalaryRuleById(id) {
    const response = await apiClient.get(`/salary-rules/${id}`);
    return response.data;
  },

  async getRulesByCategory(category) {
    const response = await apiClient.get(`/salary-rules/category/${category}`);
    return response.data;
  },

  async createSalaryRule(data) {
    const response = await apiClient.post('/salary-rules', data);
    return response.data;
  },

  async updateSalaryRule(id, data) {
    const response = await apiClient.put(`/salary-rules/${id}`, data);
    return response.data;
  },

  async deleteSalaryRule(id) {
    const response = await apiClient.delete(`/salary-rules/${id}`);
    return response.data;
  },
};

export default salaryRuleApi;
