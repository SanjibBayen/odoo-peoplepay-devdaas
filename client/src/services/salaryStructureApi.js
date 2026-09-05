import apiClient from './apiClient.js';
import {
  getSalaryStructuresFromStorage,
  saveSalaryStructuresToStorage,
} from '../data/salaryData.js';

export const salaryStructureApi = {
  async getSalaryStructures() {
    try {
      const response = await apiClient.get('/salary-structures');
      return response.data;
    } catch (error) {
      console.warn('Backend /salary-structures unavailable', error.message);
      const data = getSalaryStructuresFromStorage();
      return { success: true, data };
    }
  },

  async getSalaryStructureById(id) {
    try {
      const response = await apiClient.get(`/salary-structures/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /salary-structures/${id} unavailable`, error.message);
      const all = getSalaryStructuresFromStorage();
      const found = all.find((s) => s.id === id);
      return { success: true, data: found || null };
    }
  },

  async createSalaryStructure(structureData) {
    try {
      const response = await apiClient.post('/salary-structures', structureData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /salary-structures unavailable', error.message);
      const current = getSalaryStructuresFromStorage();
      const newStructure = {
        ...structureData,
        id: `str-${Date.now()}`,
        status: structureData.status || 'Active',
        updatedAt: new Date().toISOString().split('T')[0],
      };
      saveSalaryStructuresToStorage([newStructure, ...current]);
      return { success: true, data: newStructure };
    }
  },

  async updateSalaryStructure(id, structureData) {
    try {
      const response = await apiClient.put(`/salary-structures/${id}`, structureData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /salary-structures/${id} unavailable`, error.message);
      const current = getSalaryStructuresFromStorage();
      const index = current.findIndex((s) => s.id === id);
      if (index >= 0) {
        current[index] = {
          ...current[index],
          ...structureData,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        saveSalaryStructuresToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Structure not found' };
    }
  },
};

export default salaryStructureApi;
