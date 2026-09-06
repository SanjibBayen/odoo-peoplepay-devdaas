import dashboardApi from './dashboardApi.js';

/**
 * Service to fetch and normalize real system alerts and status items into user notifications.
 * Extensible for when a dedicated `/api/notifications` route is added to the backend.
 */
export const notificationService = {
  /**
   * Loads real alerts based on role and maps to structured notifications.
   * @param {string} role - 'admin' | 'hr-manager' | 'hr-payroll-manager' | 'hr-payroll-user' | 'employee'
   * @returns {Promise<Array>}
   */
  async loadNotifications(role = 'employee') {
    const notifications = [];

    try {
      if (role === 'employee') {
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
      } else {
        // Management roles: fetch real alerts from dashboardApi
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
};

export default notificationService;
