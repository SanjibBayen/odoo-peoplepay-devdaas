import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectCurrentRole } from '../redux/selectors/authSelectors.js';

function normalizeRoleString(r) {
  if (!r) return '';
  return r.toLowerCase().replace('-', '_');
}

/**
 * Role-Based Access Control (RBAC) Route Guard.
 * Restricts route access to specified allowed roles.
 * Unauthorized roles are redirected back to their own authorized dashboard.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of allowed role identifiers
 */
export default function RoleRoute({ allowedRoles = [] }) {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const normalizedCurrent = normalizeRoleString(currentRole);

  const isAuthorized = allowedRoles.some(
    (allowed) => normalizeRoleString(allowed) === normalizedCurrent
  );

  if (!isAuthorized) {
    const targetSlug = normalizedCurrent.replace('_', '-');
    return <Navigate to={`/dashboard/${targetSlug}`} replace />;
  }

  return <Outlet />;
}
