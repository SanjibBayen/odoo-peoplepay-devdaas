import apiClient from './apiClient.js';

export const salaryStructureApi = {
  async getSalaryStructures(params = {}) {
    const response = await apiClient.get('/salary-structures', { params });
    return response.data;
  },

  async getSalaryStructureById(id) {
    const response = await apiClient.get(`/salary-structures/${id}`);
    return response.data;
  },

  async createSalaryStructure(data) {
    const response = await apiClient.post('/salary-structures', data);
    return response.data;
  },

  async updateSalaryStructure(id, data) {
    const response = await apiClient.put(`/salary-structures/${id}`, data);
    return response.data;
  },

  async deleteSalaryStructure(id) {
    const response = await apiClient.delete(`/salary-structures/${id}`);
    return response.data;
  },

  async addRulesToStructure(id, ruleIds) {
    const response = await apiClient.post(`/salary-structures/${id}/rules`, { ruleIds });
    return response.data;
  },

  async reorderStructureRules(id, rules) {
    const response = await apiClient.put(`/salary-structures/${id}/rules/reorder`, { rules });
    return response.data;
  },

  async removeRuleFromStructure(id, ruleId) {
    const response = await apiClient.delete(`/salary-structures/${id}/rules/${ruleId}`);
    return response.data;
  },
};

export default salaryStructureApi;
