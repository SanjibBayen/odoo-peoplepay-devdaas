import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectCurrentRole } from '../redux/selectors/authSelectors.js';

function normalizeRoleString(r) {
  if (!r) return '';
  return r.toLowerCase().replace(/-/g, '_');
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
    return <Navigate to='/access-denied' replace state={{ from: location }} />;
  }

  return <Outlet />;
}