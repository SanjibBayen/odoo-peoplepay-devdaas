import apiClient from './apiClient.js';

export const payslipApi = {
  async getPayslips(params = {}) {
    try {
      const response = await apiClient.get('/payslips', { params });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Fallback to fetching payslips via payruns API
        try {
          const payrunsRes = await apiClient.get('/payruns');
          const payruns = payrunsRes.data?.data || payrunsRes.data || [];
          if (Array.isArray(payruns) && payruns.length > 0) {
            const detailRes = await apiClient.get(`/payruns/${payruns[0].id}`);
            const payrunData = detailRes.data?.data || detailRes.data;
            const slips = payrunData?.payslips || [];
            return { success: true, data: slips };
          }
          return { success: true, data: [] };
        } catch {
          return { success: true, data: [] };
        }
      }
      throw error;
    }
  },

  async getPayslipById(id) {
    try {
      const response = await apiClient.get(`/payslips/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        const list = await this.getPayslips();
        const found = list.data?.find((s) => s.id === id || s.payslipNumber === id);
        return { success: true, data: found || null };
      }
      throw error;
    }
  },

  async downloadPayslip(id, slipData = null) {
    try {
      const response = await apiClient.get(`/payslips/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // If backend download route is not implemented, generate downloadable receipt from slip data
      const slip = slipData || (await this.getPayslipById(id))?.data;
      if (!slip) throw error;
      const text = `
PEOPLEPAY SALARY SLIP
====================================
Slip Number: ${slip.payslipNumber || slip.slipNumber || id}
Employee: ${slip.employee?.firstName ? `${slip.employee.firstName} ${slip.employee.lastName}` : slip.employeeName || 'Employee'} (${slip.employeeId || ''})
Gross Salary: ₹${Number(slip.grossSalary || 0).toLocaleString()}
Total Deductions: ₹${Number(slip.totalDeductions || 0).toLocaleString()}
Net Disbursal: ₹${Number(slip.netSalary || 0).toLocaleString()}
Status: ${slip.status || 'COMPLETED'}
====================================
      `.trim();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slip.payslipNumber || slip.slipNumber || id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
  },

  async sendPayslip(id) {
    const response = await apiClient.post(`/payslips/${id}/send`);
    return response.data;
  },
};

export default payslipApi;
