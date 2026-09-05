import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Placeholder protected route guard for frontend route structure.
 * Scalable for future real token/session checks.
 */
export default function ProtectedRoute() {
  return <Outlet />;
}
