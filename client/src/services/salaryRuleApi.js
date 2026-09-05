import apiClient from './apiClient.js';
import {
  getSalaryRulesFromStorage,
  saveSalaryRulesToStorage,
} from '../data/salaryData.js';

export const salaryRuleApi = {
  async getSalaryRules() {
    try {
      const response = await apiClient.get('/salary-rules');
      const rules = response.data?.data || response.data;
      return {
        success: true,
        data: [...rules].sort((a, b) => Number(a.sequence) - Number(b.sequence)),
      };
    } catch (error) {
      console.warn('Backend /salary-rules unavailable', error.message);
      const data = getSalaryRulesFromStorage().sort(
        (a, b) => Number(a.sequence) - Number(b.sequence)
      );
      return { success: true, data };
    }
  },

  async getSalaryRuleById(id) {
    try {
      const response = await apiClient.get(`/salary-rules/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /salary-rules/${id} unavailable`, error.message);
      const all = getSalaryRulesFromStorage();
      const found = all.find((r) => r.id === id);
      return { success: true, data: found || null };
    }
  },

  async createSalaryRule(ruleData) {
    try {
      const response = await apiClient.post('/salary-rules', ruleData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /salary-rules unavailable', error.message);
      const current = getSalaryRulesFromStorage();
      const newRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        sequence: Number(ruleData.sequence) || (current.length + 1) * 10,
        status: ruleData.status || 'Active',
      };
      const updated = [...current, newRule].sort(
        (a, b) => Number(a.sequence) - Number(b.sequence)
      );
      saveSalaryRulesToStorage(updated);
      return { success: true, data: newRule };
    }
  },

  async updateSalaryRule(id, ruleData) {
    try {
      const response = await apiClient.put(`/salary-rules/${id}`, ruleData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /salary-rules/${id} unavailable`, error.message);
      const current = getSalaryRulesFromStorage();
      const index = current.findIndex((r) => r.id === id);
      if (index >= 0) {
        current[index] = {
          ...current[index],
          ...ruleData,
          sequence: Number(ruleData.sequence ?? current[index].sequence),
        };
        const sorted = current.sort((a, b) => Number(a.sequence) - Number(b.sequence));
        saveSalaryRulesToStorage(sorted);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Salary rule not found' };
    }
  },

  async deleteSalaryRule(id) {
    try {
      const response = await apiClient.delete(`/salary-rules/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /salary-rules/${id} unavailable`, error.message);
      const current = getSalaryRulesFromStorage();
      const filtered = current.filter((r) => r.id !== id);
      saveSalaryRulesToStorage(filtered);
      return { success: true, message: `Rule ${id} removed` };
    }
  },
};

export default salaryRuleApi;
