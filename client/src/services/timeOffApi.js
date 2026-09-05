import apiClient from './apiClient.js';
import {
  getAllocationsFromStorage,
  INITIAL_LEAVE_TYPES,
  getTimeOffRequestsFromStorage,
  saveAllocationsToStorage,
  saveTimeOffRequestsToStorage,
} from '../data/timeOffData.js';

export const timeOffApi = {
  async getLeaveTypes() {
    try {
      const response = await apiClient.get('/time-off/leave-types');
      return response.data;
    } catch (error) {
      console.warn('Backend /time-off/leave-types unavailable', error.message);
      return { success: true, data: INITIAL_LEAVE_TYPES };
    }
  },

  async getAllocations(params = {}) {
    try {
      const response = await apiClient.get('/time-off/allocations', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /time-off/allocations unavailable', error.message);
      let data = getAllocationsFromStorage();
      if (params.employeeId) {
        data = data.filter((a) => a.employeeId === params.employeeId);
      }
      return { success: true, data };
    }
  },

  async getRequests(params = {}) {
    try {
      const response = await apiClient.get('/time-off/requests', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend /time-off/requests unavailable', error.message);
      let data = getTimeOffRequestsFromStorage();
      if (params.employeeId) {
        data = data.filter((r) => r.employeeId === params.employeeId);
      }
      if (params.status && params.status !== 'All') {
        data = data.filter((r) => r.status === params.status);
      }
      return { success: true, data, total: data.length };
    }
  },

  async createRequest(requestData) {
    const allocations = getAllocationsFromStorage();
    const alloc = allocations.find(
      (a) =>
        a.employeeId === requestData.employeeId &&
        a.leaveTypeId === requestData.leaveTypeId
    );

    const remaining = alloc ? alloc.allocatedDays - alloc.approvedUsedDays : 5;
    if (alloc && requestData.days > remaining) {
      throw new Error(
        `Insufficient leave balance. Requested ${requestData.days} days, but only ${remaining} days remain available.`
      );
    }

    try {
      const response = await apiClient.post('/time-off/requests', requestData);
      return response.data;
    } catch (error) {
      console.warn('Backend POST /time-off/requests unavailable, saving locally.', error.message);
      const current = getTimeOffRequestsFromStorage();
      const newRequest = {
        ...requestData,
        id: `req-${Date.now()}`,
        requestId: `REQ-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      saveTimeOffRequestsToStorage([newRequest, ...current]);
      return { success: true, data: newRequest };
    }
  },

  async approveRequest(id, { reviewNotes } = {}) {
    try {
      const response = await apiClient.patch(`/time-off/requests/${id}/approve`, { reviewNotes });
      return response.data;
    } catch (error) {
      console.warn(`Backend PATCH /time-off/requests/${id}/approve unavailable`, error.message);
      const requests = getTimeOffRequestsFromStorage();
      const req = requests.find((r) => r.id === id);
      if (req) {
        req.status = 'Approved';
        req.reviewNotes = reviewNotes || 'Approved by Manager';
        saveTimeOffRequestsToStorage(requests);

        // Deduct from allocation
        const allocations = getAllocationsFromStorage();
        const alloc = allocations.find(
          (a) => a.employeeId === req.employeeId && a.leaveTypeId === req.leaveTypeId
        );
        if (alloc) {
          alloc.approvedUsedDays += req.days;
          saveAllocationsToStorage(allocations);
        }

        return { success: true, data: req };
      }
      return { success: false, message: 'Request not found' };
    }
  },

  async rejectRequest(id, { reason } = {}) {
    try {
      const response = await apiClient.patch(`/time-off/requests/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.warn(`Backend PATCH /time-off/requests/${id}/reject unavailable`, error.message);
      const requests = getTimeOffRequestsFromStorage();
      const req = requests.find((r) => r.id === id);
      if (req) {
        req.status = 'Rejected';
        req.reviewNotes = reason || 'Declined per operational schedule';
        saveTimeOffRequestsToStorage(requests);
        return { success: true, data: req };
      }
      return { success: false, message: 'Request not found' };
    }
  },

  async submitRequest(requestData) {
    return this.createRequest(requestData);
  },

  async updateRequestStatus(id, status, notes) {
    if (status === 'Approved') {
      return this.approveRequest(id);
    }
    return this.rejectRequest(id, notes);
  },
};

export default timeOffApi;
