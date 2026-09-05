import apiClient from './apiClient.js';

export const timeOffApi = {
  // ============ TIME OFF TYPES ============
  async getTimeOffTypes() {
    const response = await apiClient.get('/time-off-types');
    return response.data;
  },

  async getTimeOffTypeById(id) {
    const response = await apiClient.get(`/time-off-types/${id}`);
    return response.data;
  },

  async createTimeOffType(data) {
    const response = await apiClient.post('/time-off-types', data);
    return response.data;
  },

  async updateTimeOffType(id, data) {
    const response = await apiClient.put(`/time-off-types/${id}`, data);
    return response.data;
  },

  async deleteTimeOffType(id) {
    const response = await apiClient.delete(`/time-off-types/${id}`);
    return response.data;
  },

  // Alias for compatibility
  async getLeaveTypes() {
    return this.getTimeOffTypes();
  },

  // ============ ALLOCATIONS ============
  async getAllocations(params = {}) {
    const response = await apiClient.get('/time-off-allocations', { params });
    return response.data;
  },

  async getAllocationById(id) {
    const response = await apiClient.get(`/time-off-allocations/${id}`);
    return response.data;
  },

  async getEmployeeBalances(employeeId) {
    const response = await apiClient.get(`/time-off-allocations/employee/${employeeId}`);
    return response.data;
  },

  async createAllocation(data) {
    const response = await apiClient.post('/time-off-allocations', data);
    return response.data;
  },

  async updateAllocation(id, data) {
    const response = await apiClient.put(`/time-off-allocations/${id}`, data);
    return response.data;
  },

  async approveAllocation(id) {
    const response = await apiClient.put(`/time-off-allocations/${id}/approve`);
    return response.data;
  },

  async refuseAllocation(id) {
    const response = await apiClient.put(`/time-off-allocations/${id}/refuse`);
    return response.data;
  },

  async deleteAllocation(id) {
    const response = await apiClient.delete(`/time-off-allocations/${id}`);
    return response.data;
  },

  // ============ REQUESTS ============
  async getRequests(params = {}) {
    const response = await apiClient.get('/time-off-requests', { params });
    return response.data;
  },

  async getMyRequests(params = {}) {
    const response = await apiClient.get('/time-off-requests/my-requests', { params });
    return response.data;
  },

  async getRequestById(id) {
    const response = await apiClient.get(`/time-off-requests/${id}`);
    return response.data;
  },

  async createRequest(data) {
    const response = await apiClient.post('/time-off-requests', data);
    return response.data;
  },

  async approveRequest(id) {
    const response = await apiClient.put(`/time-off-requests/${id}/approve`);
    return response.data;
  },

  async refuseRequest(id, { refusalReason } = {}) {
    const response = await apiClient.put(`/time-off-requests/${id}/refuse`, { refusalReason });
    return response.data;
  },

  async cancelRequest(id) {
    const response = await apiClient.put(`/time-off-requests/${id}/cancel`);
    return response.data;
  },

  // Aliases for compatibility
  async submitRequest(data) {
    return this.createRequest(data);
  },

  async rejectRequest(id, options = {}) {
    return this.refuseRequest(id, { refusalReason: options.reason || options.reviewNotes });
  },

  async updateRequestStatus(id, status, notes) {
    if (status === 'Approved' || status === 'APPROVED') {
      return this.approveRequest(id);
    }
    return this.refuseRequest(id, { refusalReason: notes });
  },
};

export default timeOffApi;
