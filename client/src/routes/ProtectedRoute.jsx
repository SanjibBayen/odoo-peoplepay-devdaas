import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute guard: Ensures the user has an active session / token.
 * Redirects unauthenticated users to the login screen.
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useSelector(
    (state) => state.auth?.isAuthenticated || Boolean(state.auth?.token)
  );
  const hasStoredToken =
    typeof window !== 'undefined' &&
    Boolean(
      localStorage.getItem('peoplepay_token') ||
        sessionStorage.getItem('peoplepay_token') ||
        localStorage.getItem('token')
    );

  if (!isAuthenticated && !hasStoredToken) {
    // Redirect to appropriate login based on attempted path
    const path = location.pathname;
    let loginPath = '/login/employee';

    if (path.includes('/admin')) loginPath = '/login/admin';
    else if (path.includes('/hr-payroll-manager')) loginPath = '/login/hr-payroll-manager';
    else if (path.includes('/hr-payroll-user')) loginPath = '/login/hr-payroll-user';
    else if (path.includes('/hr-manager')) loginPath = '/login/hr-manager';

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <Outlet />;
}