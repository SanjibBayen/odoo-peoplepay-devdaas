import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Public route wrapper for accessible public pages.
 */
export default function PublicRoutes() {
  return <Outlet />;
}
