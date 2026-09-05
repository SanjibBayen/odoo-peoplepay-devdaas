import apiClient from './apiClient.js';
import { EMPLOYEE_DATA } from '../data/employeeDashboardData.js';
import { HR_MANAGER_DATA } from '../data/hrManagerDashboardData.js';
import { HR_PAYROLL_USER_DATA } from '../data/hrPayrollUserDashboardData.js';
import { HR_PAYROLL_MANAGER_DATA } from '../data/hrPayrollManagerDashboardData.js';
import { ADMIN_DATA } from '../data/adminDashboardData.js';

export const dashboardApi = {
  async getEmployeeDashboard() {
    try {
      const response = await apiClient.get('/dashboard/employee');
      return response.data;
    } catch (error) {
      console.warn('Backend /dashboard/employee unavailable', error.message);
      return { success: true, data: EMPLOYEE_DATA };
    }
  },

  async getHrManagerDashboard() {
    try {
      const response = await apiClient.get('/dashboard/hr-manager');
      return response.data;
    } catch (error) {
      console.warn('Backend /dashboard/hr-manager unavailable', error.message);
      return { success: true, data: HR_MANAGER_DATA };
    }
  },

  async getPayrollUserDashboard() {
    try {
      const response = await apiClient.get('/dashboard/payroll-user');
      return response.data;
    } catch (error) {
      console.warn('Backend /dashboard/payroll-user unavailable', error.message);
      return { success: true, data: HR_PAYROLL_USER_DATA };
    }
  },

  async getPayrollManagerDashboard() {
    try {
      const response = await apiClient.get('/dashboard/payroll-manager');
      return response.data;
    } catch (error) {
      console.warn('Backend /dashboard/payroll-manager unavailable', error.message);
      return { success: true, data: HR_PAYROLL_MANAGER_DATA };
    }
  },

  async getAdminDashboard() {
    try {
      const response = await apiClient.get('/dashboard/admin');
      return response.data;
    } catch (error) {
      console.warn('Backend /dashboard/admin unavailable', error.message);
      return { success: true, data: ADMIN_DATA };
    }
  },

  getHRManagerDashboard() {
    return this.getHrManagerDashboard();
  },

  getHRPayrollDashboard() {
    return this.getPayrollUserDashboard();
  },
};

export default dashboardApi;
