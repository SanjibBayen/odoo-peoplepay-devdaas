import apiClient from './apiClient.js';

export const employeeApi = {
  /**
   * Get paginated employees with filtering & sorting
   * @param {Object} params - { page, limit, search, status, departmentId, employeeTypeId, jobPositionId, sortBy, sortOrder }
   */
  async getEmployees(params = {}) {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  /**
   * Get single employee by ID
   * @param {string} id
   */
  async getEmployeeById(id) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create new employee
   * @param {Object} employeeData
   */
  async createEmployee(employeeData) {
    const response = await apiClient.post('/employees', employeeData);
    return response.data;
  },

  /**
   * Update existing employee
   * @param {string} id
   * @param {Object} employeeData
   */
  async updateEmployee(id, employeeData) {
    const response = await apiClient.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  /**
   * Soft delete / terminate employee
   * @param {string} id
   */
  async deleteEmployee(id) {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  /**
   * Get employee's contracts
   * @param {string} id
   */
  async getEmployeeContracts(id) {
    const response = await apiClient.get(`/employees/${id}/contracts`);
    return response.data;
  },

  /**
   * Get employee's attendance
   * @param {string} id
   */
  async getEmployeeAttendance(id) {
    const response = await apiClient.get(`/employees/${id}/attendance`);
    return response.data;
  },

  /**
   * Get employee's time off requests
   * @param {string} id
   */
  async getEmployeeTimeOffRequests(id) {
    const response = await apiClient.get(`/employees/${id}/time-off-requests`);
    return response.data;
  },

  /**
   * Get employee's leave balances
   * @param {string} id
   */
  async getEmployeeLeaveBalances(id) {
    const response = await apiClient.get(`/employees/${id}/leave-balances`);
    return response.data;
  },

  /**
   * Get employee's active contract
   * @param {string} id
   */
  async getEmployeeActiveContract(id) {
    const response = await apiClient.get(`/employees/${id}/active-contract`);
    return response.data;
  },
};

export default employeeApi;
