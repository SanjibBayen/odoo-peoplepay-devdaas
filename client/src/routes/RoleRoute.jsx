import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectCurrentRole } from '../redux/selectors/authSelectors.js';

function normalizeRoleString(r) {
  if (!r) return '';
  return r.toLowerCase().replace('-', '_');
}

/**
 * Role-Based Access Control (RBAC) Route Guard.
 * Restricts route access to specified allowed roles.
 * Unauthorized roles are redirected back to their own authorized dashboard.
 */
export default function RoleRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const normalizedCurrent = normalizeRoleString(currentRole);

  const isAuthorized = allowedRoles.some(
    (allowed) => normalizeRoleString(allowed) === normalizedCurrent
  );

  if (!isAuthorized) {
    // Map role to correct dashboard path
    const dashboardPaths = {
      employee: '/employee/dashboard',
      hr_manager: '/hr-manager/dashboard',
      hr_payroll_user: '/hr-payroll-user/dashboard',
      hr_payroll_manager: '/hr-payroll-manager/dashboard',
      admin: '/admin/dashboard',
    };

    const redirectPath = dashboardPaths[normalizedCurrent] || '/employee/dashboard';
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return <Outlet />;
}