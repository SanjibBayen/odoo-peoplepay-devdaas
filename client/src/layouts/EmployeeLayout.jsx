import React from 'react';
import AppLayout from './AppLayout.jsx';
import { EMPLOYEE_DATA } from '../data/employeeDashboardData.js';

/**
 * Backward-compatible EmployeeLayout wrapper pointing to the unified AppLayout.
 */
export default function EmployeeLayout({ children }) {
  return (
    <AppLayout
      roleId='employee'
      title='Employee Dashboard'
      portalName='Employee Portal'
      user={EMPLOYEE_DATA.user}
    >
      {children}
    </AppLayout>
  );
}
