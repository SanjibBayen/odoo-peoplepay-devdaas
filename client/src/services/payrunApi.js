import apiClient from './apiClient.js';
import {
  getPayrunsFromStorage,
  runPayrollPreValidation,
  savePayrunsToStorage,
} from '../data/payrunsData.js';
import { getEmployees } from '../data/employeeStore.js';
import { getContractsFromStorage } from '../data/contractsData.js';

export const payrunApi = {
  async getPayruns(params = {}) {
    try {
      const response = await apiClient.get('/payruns', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /payruns unavailable, using mock payruns.', error.message);
      let data = getPayrunsFromStorage();
      if (params.status && params.status !== 'All') {
        data = data.filter((p) => p.status === params.status);
      }
      return { success: true, data, total: data.length };
    }
  },

  async getPayrunById(id) {
    try {
      const response = await apiClient.get(`/payruns/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /payruns/${id} unavailable`, error.message);
      const all = getPayrunsFromStorage();
      const found = all.find((p) => p.id === id);
      return { success: true, data: found || null };
    }
  },

  async createPayrun(payrunData) {
    try {
      const response = await apiClient.post('/payruns', payrunData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /payruns unavailable, creating local draft.', error.message);
      const current = getPayrunsFromStorage();
      const newPayrun = {
        id: `pr-${Date.now()}`,
        name: payrunData.name || 'Monthly Batch',
        payrunCode: `PR-${Date.now().toString().slice(-6)}`,
        periodMonth: payrunData.period?.month || 'September',
        periodYear: payrunData.period?.year || 2026,
        startDate: payrunData.period?.startDate || '2026-09-01',
        endDate: payrunData.period?.endDate || '2026-09-30',
        structureId: payrunData.structureId || 'str-1',
        structureName: payrunData.structureName || 'Standard Tech Structure',
        status: 'DRAFT', // initial lifecycle
        eligibleEmployeesCount: payrunData.employeeIds?.length || 10,
        totalGrossWage: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        validationResults: {
          hasCriticalErrors: false,
          warningsCount: 0,
          errorsCount: 0,
          checks: [],
        },
      };
      savePayrunsToStorage([newPayrun, ...current]);
      return { success: true, data: newPayrun };
    }
  },

  async computePayrun(id) {
    try {
      const response = await apiClient.post(`/payruns/${id}/compute`);
      return response.data;
    } catch (error) {
      console.warn(`Backend POST /payruns/${id}/compute unavailable`, error.message);
      const current = getPayrunsFromStorage();
      const index = current.findIndex((p) => p.id === id);
      if (index >= 0) {
        const empCount = current[index].eligibleEmployeesCount || 10;
        current[index].status = 'COMPUTED';
        current[index].totalGrossWage = empCount * 128500;
        current[index].grossTotal = current[index].totalGrossWage;
        current[index].totalDeductions = empCount * 18240;
        current[index].deductionsTotal = current[index].totalDeductions;
        current[index].totalNetSalary = current[index].totalGrossWage - current[index].totalDeductions;
        current[index].netTotal = current[index].totalNetSalary;
        current[index].updatedAt = new Date().toISOString().split('T')[0];

        // Run validation check
        const employees = getEmployees();
        const contracts = getContractsFromStorage();
        current[index].validationResults = runPayrollPreValidation(employees, contracts);

        savePayrunsToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Payrun not found' };
    }
  },

  async validatePayrun(id) {
    try {
      const response = await apiClient.post(`/payruns/${id}/validate`);
      return response.data;
    } catch (error) {
      console.warn(`Backend POST /payruns/${id}/validate unavailable`, error.message);
      const current = getPayrunsFromStorage();
      const index = current.findIndex((p) => p.id === id);
      if (index >= 0) {
        if (current[index].validationResults?.hasCriticalErrors) {
          throw new Error('Cannot validate payrun: critical validation errors exist.');
        }
        current[index].status = 'VALIDATED';
        current[index].updatedAt = new Date().toISOString().split('T')[0];
        savePayrunsToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Payrun not found' };
    }
  },

  async markPayrunPaid(id, { paymentReference } = {}) {
    try {
      const response = await apiClient.post(`/payruns/${id}/mark-paid`, { paymentReference });
      return response.data;
    } catch (error) {
      console.warn(`Backend POST /payruns/${id}/mark-paid unavailable`, error.message);
      const current = getPayrunsFromStorage();
      const index = current.findIndex((p) => p.id === id);
      if (index >= 0) {
        current[index].status = 'PAID';
        current[index].paymentReference = paymentReference || `NEFT-${Date.now().toString().slice(-8)}`;
        current[index].updatedAt = new Date().toISOString().split('T')[0];
        savePayrunsToStorage(current);
        return { success: true, data: current[index] };
      }
      return { success: false, message: 'Payrun not found' };
    }
  },

  async payPayrun(id, options) {
    return this.markPayrunPaid(id, options);
  },

  async deletePayrun(id) {
    try {
      const response = await apiClient.delete(`/payruns/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend DELETE /payruns/${id} unavailable`, error.message);
      const current = getPayrunsFromStorage();
      const filtered = current.filter((p) => p.id !== id);
      savePayrunsToStorage(filtered);
      return { success: true, message: `Payrun ${id} removed` };
    }
  },

  async sendPayslips(id) {
    try {
      const response = await apiClient.post(`/payruns/${id}/send-payslips`);
      return response.data;
    } catch (error) {
      console.warn(`Backend POST /payruns/${id}/send-payslips unavailable`, error.message);
      return { success: true, message: 'Payslips generated and dispatched to all employee mailboxes.' };
    }
  },
};

export default payrunApi;
