import dashboardApi from './dashboardApi.js';
import notificationApi from './notificationApi.js';

/**
 * Service to fetch and normalize real system alerts and status items into user notifications.
 * Connects to /api/notifications first with graceful fallback to dashboard alert data.
 */
export const notificationService = {
  /**
   * Loads real notifications or alerts based on role.
   * @param {string} role - 'admin' | 'hr-manager' | 'hr-payroll-manager' | 'hr-payroll-user' | 'employee'
   * @returns {Promise<Array>}
   */
  async loadNotifications(role = 'employee') {
    const notifications = [];
    const normalizedRole = (typeof role === 'string' ? role : 'employee')
      .toLowerCase()
      .replace(/_/g, '-');

    // 1. Attempt to fetch from real dedicated /api/notifications endpoint
    try {
      const res = await notificationApi.getNotifications().catch(() => null);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item) => {
          let category = 'System';
          let route = item.route || null;

          if (item.entityType === 'payslip' || item.type === 'SUCCESS') {
            category = 'Payroll';
            if (!route && item.entityId) route = `/payslips/${item.entityId}`;
          } else if (item.entityType === 'TimeOffRequest') {
            category = 'Time Off';
            if (!route) route = '/time-off';
          } else if (item.entityType === 'Payrun') {
            category = 'Payroll';
            if (!route && item.entityId) route = `/payruns/${item.entityId}`;
          }

          return {
            id: item.id,
            title: item.title,
            message: item.message,
            time: item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : 'Recent',
            category,
            route,
            read: !!item.isRead,
          };
        });
      }
    } catch {
      // Fall through to dashboard API fallback
    }

    // 2. Fallback: Extract from real role-specific dashboard endpoints
    try {
      if (normalizedRole === 'employee') {
        const empRes = await dashboardApi.getEmployeeDashboard().catch(() => null);
        const empData = empRes?.data || null;

        if (empData?.pendingRequests?.length > 0) {
          empData.pendingRequests.forEach((req, idx) => {
            notifications.push({
              id: `leave-req-${req.id || idx}`,
              title: 'Leave Request Pending',
              message: `Your ${req.type || 'Time Off'} request is awaiting supervisor review.`,
              time: req.startDate || 'Recent',
              category: 'Time Off',
              route: '/time-off',
              read: false,
            });
          });
        }

        if (empData?.recentPayslips?.length > 0) {
          const latestSlip = empData.recentPayslips[0];
          notifications.push({
            id: `slip-${latestSlip.id}`,
            title: 'Payslip Available',
            message: `Your payslip #${latestSlip.payslipNumber} has been finalized.`,
            time: 'Recent',
            category: 'Payroll',
            route: `/payslips/${latestSlip.id}`,
            read: false,
          });
        }

        // Attendance reminder if missing checkout
        if (empData?.attendanceToday && !empData.attendanceToday.checkOut) {
          notifications.push({
            id: 'att-today-reminder',
            title: 'Active Shift in Progress',
            message: 'Remember to record your check-out when completing your workday.',
            time: 'Today',
            category: 'Attendance',
            route: '/attendance',
            read: false,
          });
        }
      } else if (['admin', 'hr-manager', 'hr-payroll-manager', 'hr-payroll-user'].includes(normalizedRole)) {
        // Management roles: fetch real alerts from dashboardApi (requires reports:read)
        const alertsRes = await dashboardApi.getAlerts().catch(() => null);
        const alerts = alertsRes?.data || [];

        alerts.forEach((alert, idx) => {
          let category = 'System';
          let route = null;

          const type = (alert.type || '').toUpperCase();
          if (type.includes('PAYROLL') || type.includes('WAGE') || type.includes('SALARY')) {
            category = 'Payroll';
            route = '/payruns';
          } else if (type.includes('ATTENDANCE') || type.includes('CHECKOUT')) {
            category = 'Attendance';
            route = '/attendance';
          } else if (type.includes('LEAVE') || type.includes('TIME_OFF')) {
            category = 'Time Off';
            route = '/time-off';
          } else if (type.includes('BANK') || type.includes('EMPLOYEE')) {
            category = 'Employee';
            route = '/employees';
          } else if (type.includes('CONTRACT')) {
            category = 'Employee';
            route = '/contracts';
          }

          notifications.push({
            id: `alert-${alert.id || idx}-${type}`,
            title: alert.type ? alert.type.replace(/_/g, ' ') : 'System Notice',
            message: alert.message || 'Operational attention needed.',
            time: alert.createdAt
              ? new Date(alert.createdAt).toLocaleDateString()
              : 'Recent',
            category,
            route,
            read: false,
          });
        });
      }
    } catch (err) {
      console.warn('Failed to load system notifications:', err.message);
    }

    return notifications;
  },

  /**
   * Sync read action with backend
   */
  async markRead(id) {
    if (!id || id.startsWith('leave-req-') || id.startsWith('slip-') || id.startsWith('att-') || id.startsWith('alert-')) {
      return;
    }
    try {
      await notificationApi.markAsRead(id);
    } catch {
      // Ignore background sync errors
    }
  },

  /**
   * Sync mark all as read with backend
   */
  async markAllRead() {
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // Ignore background sync errors
    }
  },
};

export default notificationService;
