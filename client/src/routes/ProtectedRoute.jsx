import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectCurrentRole } from '../redux/selectors/authSelectors.js';

/**
 * Route guard checking authentication state in Redux store.
 * Unauthenticated requests are directed to the login screen.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentRole = useSelector(selectCurrentRole);
  const location = useLocation();

  if (!isAuthenticated) {
    const roleSlug = currentRole ? currentRole.replace('_', '-') : 'employee';
    return <Navigate to={`/login/${roleSlug}`} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
