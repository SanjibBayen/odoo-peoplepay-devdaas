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
      const response = await apiClient.get('/reports/payroll-cost');
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/payroll-cost unavailable', error.message);
      return { success: true, data: PAYROLL_COST_REPORT };
    }
  },

  async getMonthlyTrendReport() {
    try {
      const response = await apiClient.get('/reports/monthly-trend');
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/monthly-trend unavailable', error.message);
      return { success: true, data: MONTHLY_TREND_REPORT };
    }
  },

  async getDepartmentCostReport() {
    try {
      const response = await apiClient.get('/reports/department-cost');
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/department-cost unavailable', error.message);
      return { success: true, data: DEPARTMENT_COST_REPORT };
    }
  },

  async getAttendanceHealthReport() {
    try {
      const response = await apiClient.get('/reports/attendance-health');
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/attendance-health unavailable', error.message);
      return { success: true, data: ATTENDANCE_HEALTH_REPORT };
    }
  },

  async getEmployeeStatsReport() {
    try {
      const response = await apiClient.get('/reports/employee-stats');
      return response.data;
    } catch (error) {
      console.warn('Backend /reports/employee-stats unavailable', error.message);
      return { success: true, data: EMPLOYEE_STATS_REPORT };
    }
  },
};

export default reportApi;
