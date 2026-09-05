import apiClient from './apiClient.js';
import {
  ATTENDANCE_HEALTH_REPORT,
  DEPARTMENT_COST_REPORT,
  EMPLOYEE_STATS_REPORT,
  MONTHLY_TREND_REPORT,
  PAYROLL_COST_REPORT,
} from '../data/reportsData.js';

export const reportApi = {
  async getPayrollCostReport() {
    try {
      const response = await apiClient.get('/dashboard/kpis');
      const kpis = response.data?.data || response.data;
      return {
        success: true,
        data: {
          totalPayrollCost: kpis.totalNetSalary || 4820000,
          grossSalary: (kpis.totalNetSalary || 4820000) * 1.15,
          statutoryDeductions: (kpis.totalNetSalary || 4820000) * 0.15,
          activeHeadcount: kpis.activeEmployees || 38,
          currency: 'INR',
        },
      };
    } catch {
      return { success: true, data: PAYROLL_COST_REPORT };
    }
  },

  async getMonthlyTrendReport() {
    try {
      const response = await apiClient.get('/dashboard/monthly-trends');
      return response.data;
    } catch {
      return { success: true, data: MONTHLY_TREND_REPORT };
    }
  },

  async getDepartmentCostReport() {
    try {
      const response = await apiClient.get('/dashboard/salary-by-department');
      const list = response.data?.data || response.data;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((d) => ({
          department: d.departmentName,
          cost: d.totalNetSalary,
          headcount: d.headcount,
          percentage: d.averageSalary,
        }));
        return { success: true, data: mapped };
      }
      return { success: true, data: DEPARTMENT_COST_REPORT };
    } catch {
      return { success: true, data: DEPARTMENT_COST_REPORT };
    }
  },

  async getAttendanceHealthReport() {
    try {
      const response = await apiClient.get('/dashboard/attendance-overview');
      return response.data;
    } catch {
      return { success: true, data: ATTENDANCE_HEALTH_REPORT };
    }
  },

  async getEmployeeStatsReport() {
    try {
      const response = await apiClient.get('/dashboard/kpis');
      const kpis = response.data?.data || response.data;
      return {
        success: true,
        data: {
          totalEmployees: kpis.activeEmployees || 38,
          activeEmployees: kpis.activeEmployees || 38,
          onLeaveEmployees: kpis.pendingLeaves || 3,
        },
      };
    } catch {
      return { success: true, data: EMPLOYEE_STATS_REPORT };
    }
  },
};

export default reportApi;
