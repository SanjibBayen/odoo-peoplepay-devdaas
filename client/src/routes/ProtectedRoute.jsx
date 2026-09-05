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
    return <Navigate to='/login/employee' state={{ from: location }} replace />;
  }

  return <Outlet />;
}

