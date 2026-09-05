import apiClient from './apiClient.js';

export const dashboardApi = {
  // ============ HR/ADMIN DASHBOARD ENDPOINTS ============

  // Complete backend dashboard
  async getDashboard(params = {}) {
    const response = await apiClient.get('/dashboard/kpis', { params });
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

  // ============ EMPLOYEE DASHBOARD ENDPOINT ============

  async getEmployeeDashboard(params = {}) {
    const response = await apiClient.get('/dashboard/employee-kpis', { params });
    return response.data;
  },

  // ============ ROLE-BASED HELPERS ============

  async getAdminDashboard(params = {}) {
    return this.getKPIs(params);
  },

  async getHrManagerDashboard(params = {}) {
    return this.getKPIs(params);
  },

  async getPayrollUserDashboard(params = {}) {
    return this.getKPIs(params);
  },

  async getPayrollManagerDashboard(params = {}) {
    return this.getKPIs(params);
  },

  getHRManagerDashboard() {
    return this.getHrManagerDashboard();
  },

  getHRPayrollDashboard() {
    return this.getPayrollUserDashboard();
  },
};

export default dashboardApi;