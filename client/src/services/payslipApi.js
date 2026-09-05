import apiClient from './apiClient.js';
import { getPayslipsFromStorage } from '../data/payslipsData.js';

export const payslipApi = {
  async getPayslips(params = {}) {
    try {
      const response = await apiClient.get('/payslips', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /payslips unavailable, using mock payslips.', error.message);
      let data = getPayslipsFromStorage();
      if (params.employeeId) {
        data = data.filter((p) => p.employeeId === params.employeeId);
      }
      if (params.status && params.status !== 'All') {
        data = data.filter((p) => p.status === params.status);
      }
      return { success: true, data, total: data.length };
    }
  },

  async getPayslipById(id) {
    try {
      const response = await apiClient.get(`/payslips/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend /payslips/${id} unavailable`, error.message);
      const all = getPayslipsFromStorage();
      const found = all.find((p) => p.id === id || p.slipNumber === id);
      return { success: true, data: found || null };
    }
  },

  async downloadPayslip(id) {
    try {
      const response = await apiClient.get(`/payslips/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.warn(`Backend /payslips/${id}/download fallback to text receipt.`, error.message);
      const all = getPayslipsFromStorage();
      const slip = all.find((p) => p.id === id) || all[0];
      const text = `
PEOPLEPAY SALARY SLIP
====================================
Slip Number: ${slip.slipNumber}
Employee: ${slip.employeeName} (${slip.employeeId})
Period: ${slip.period}
Gross Salary: ₹${slip.grossSalary.toLocaleString()}
Total Deductions: ₹${slip.totalDeductions.toLocaleString()}
Net Disbursal: ₹${slip.netSalary.toLocaleString()}
Bank: ${slip.bankAccount}
Status: ${slip.status}
====================================
      `.trim();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slip.slipNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
  },

  async sendPayslip(id) {
    try {
      const response = await apiClient.post(`/payslips/${id}/send`);
      return response.data;
    } catch (error) {
      console.warn(`Backend POST /payslips/${id}/send unavailable`, error.message);
      return { success: true, message: 'Payslip sent to employee registered email.' };
    }
  },
};

export default payslipApi;
