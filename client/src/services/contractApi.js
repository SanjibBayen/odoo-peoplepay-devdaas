import apiClient from './apiClient.js';
import {
  checkContractOverlap,
  getContractsFromStorage,
  saveContractsToStorage,
} from '../data/contractsData.js';

export const contractApi = {
  async getContracts(params = {}) {
    try {
      const response = await apiClient.get('/contracts', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /contracts unavailable, using mock contract store.', error.message);
      let data = getContractsFromStorage();
      if (params.employeeId) {
        data = data.filter((c) => c.employeeId === params.employeeId);
      }
      if (params.status && params.status !== 'All') {
        data = data.filter((c) => c.status === params.status);
      }
      return { success: true, data, total: data.length };
    }
  },

  async getContractById(id) {
    try {
      const response = await apiClient.get(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /contracts/${id} unavailable`, error.message);
      const all = getContractsFromStorage();
      const found = all.find((c) => c.id === id || c.contractCode === id);
      return { success: true, data: found || null };
    }
  },

  async createContract(contractData) {
    // Validate overlap locally first
    const current = getContractsFromStorage();
    const overlapCheck = checkContractOverlap(current, contractData);
    if (overlapCheck.hasOverlap) {
      throw new Error(overlapCheck.message);
    }

    try {
      const response = await apiClient.post('/contracts', contractData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /contracts unavailable, storing locally.', error.message);
      const newRecord = {
        ...contractData,
        id: `ct-${Date.now()}`,
        contractCode:
          contractData.contractCode ||
          `CNT-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        status: contractData.status || 'Active',
      };
      const updated = [newRecord, ...current];
      saveContractsToStorage(updated);
      return { success: true, data: newRecord };
    }
  },

  async updateContract(id, contractData) {
    const current = getContractsFromStorage();
    const overlapCheck = checkContractOverlap(current, { ...contractData, id });
    if (overlapCheck.hasOverlap) {
      throw new Error(overlapCheck.message);
    }

    try {
      const response = await apiClient.put(`/contracts/${id}`, contractData);
      return response.data;
    } catch (error) {
      console.warn(`Backend PUT /contracts/${id} unavailable, saving locally.`, error.message);
      const index = current.findIndex((c) => c.id === id);
      if (index >= 0) {
        current[index] = { ...current[index], ...contractData };
        saveContractsToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Contract not found' };
    }
  },

  async archiveContract(id) {
    try {
      const response = await apiClient.patch(`/contracts/${id}/archive`);
      return response.data;
    } catch (error) {
      console.warn(`Backend PATCH /contracts/${id}/archive unavailable`, error.message);
      const current = getContractsFromStorage();
      const index = current.findIndex((c) => c.id === id);
      if (index >= 0) {
        current[index].status = 'Archived';
        saveContractsToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Contract not found' };
    }
  },

  async deleteContract(id) {
    try {
      const response = await apiClient.delete(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /contracts/${id} unavailable`, error.message);
      const current = getContractsFromStorage();
      const filtered = current.filter((c) => c.id !== id);
      saveContractsToStorage(filtered);
      return { success: true, message: `Contract ${id} removed` };
    }
  },
};

export default contractApi;
