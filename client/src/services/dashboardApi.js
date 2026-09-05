import apiClient from './apiClient.js';

export const dashboardApi = {
  // Complete backend dashboard
  async getDashboard(params = {}) {
    const response = await apiClient.get('/dashboard', { params });
    return response.data;
  },

  async getKPIs(params = {}) {
    const response = await apiClient.get('/dashboard/kpis', { params });
    return response.data;
  },

  async getSalaryByDepartment(params = {}) {
    const response = await apiClient.get('/dashboard/salary-by-department', { params });
    return response.data;
  },

  async getMonthlyTrends(params = {}) {
    const response = await apiClient.get('/dashboard/monthly-trends', { params });
    return response.data;
  },

  async getAttendanceOverview(params = {}) {
    const response = await apiClient.get('/dashboard/attendance-overview', { params });
    return response.data;
  },

  async getTimeOffOverview(params = {}) {
    const response = await apiClient.get('/dashboard/timeoff-overview', { params });
    return response.data;
  },

  async getAlerts(params = {}) {
    const response = await apiClient.get('/dashboard/alerts', { params });
    return response.data;
  },

  // Role dashboard helpers calling real backend
  async getAdminDashboard(params = {}) {
    return this.getDashboard(params);
  },

  async getHrManagerDashboard(params = {}) {
    return this.getDashboard(params);
  },

  async getPayrollUserDashboard(params = {}) {
    return this.getDashboard(params);
  },

  async getPayrollManagerDashboard(params = {}) {
    return this.getDashboard(params);
  },

  async getEmployeeDashboard(params = {}) {
    // Return relevant employee-scoped attendance / requests data or dashboard
    return this.getDashboard(params);
  },

  getHRManagerDashboard() {
    return this.getHrManagerDashboard();
  },

  getHRPayrollDashboard() {
    return this.getPayrollUserDashboard();
  },
};

export default dashboardApi;
