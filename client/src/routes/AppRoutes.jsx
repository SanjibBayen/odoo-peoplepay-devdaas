import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ADMIN_DATA } from '../data/adminDashboardData.js';
import { EMPLOYEE_DATA } from '../data/employeeDashboardData.js';
import { HR_MANAGER_DATA } from '../data/hrManagerDashboardData.js';
import { HR_PAYROLL_MANAGER_DATA } from '../data/hrPayrollManagerDashboardData.js';
import { HR_PAYROLL_USER_DATA } from '../data/hrPayrollUserDashboardData.js';
import AppLayout from '../layouts/AppLayout.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminLoginPage from '../pages/auth/AdminLoginPage.jsx';
import EmployeeLoginPage from '../pages/auth/EmployeeLoginPage.jsx';
import HRManagerLoginPage from '../pages/auth/HRManagerLoginPage.jsx';
import HRPayrollManagerLoginPage from '../pages/auth/HRPayrollManagerLoginPage.jsx';
import HRPayrollUserLoginPage from '../pages/auth/HRPayrollUserLoginPage.jsx';
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage.jsx';
import HRManagerDashboardPage from '../pages/hr-manager/HRManagerDashboardPage.jsx';
import HRPayrollManagerDashboardPage from '../pages/hr-payroll-manager/HRPayrollManagerDashboardPage.jsx';
import HRPayrollUserDashboardPage from '../pages/hr-payroll-user/HRPayrollUserDashboardPage.jsx';
import LandingPage from '../pages/public/LandingPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoutes from './PublicRoutes.jsx';

/**
 * Main application routes configuration for PeoplePay.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoutes />}>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login/employee' element={<EmployeeLoginPage />} />
        <Route path='/login/hr-manager' element={<HRManagerLoginPage />} />
        <Route
          path='/login/hr-payroll-user'
          element={<HRPayrollUserLoginPage />}
        />
        <Route
          path='/login/hr-payroll-manager'
          element={<HRPayrollManagerLoginPage />}
        />
        <Route path='/login/admin' element={<AdminLoginPage />} />
      </Route>

      {/* Protected Routes (All Five Production-Quality Role Dashboards) */}
      <Route element={<ProtectedRoute />}>
        {/* 1. Employee Dashboard */}
        <Route
          path='/dashboard/employee'
          element={
            <AppLayout
              roleId='employee'
              title='Employee Dashboard'
              portalName='Employee Portal'
              user={EMPLOYEE_DATA.user}
            >
              <EmployeeDashboardPage />
            </AppLayout>
          }
        />

        {/* 2. HR Manager Dashboard */}
        <Route
          path='/dashboard/hr-manager'
          element={
            <AppLayout
              roleId='hr-manager'
              title='HR Manager'
              portalName='HR Manager Portal'
              user={HR_MANAGER_DATA.user}
            >
              <HRManagerDashboardPage />
            </AppLayout>
          }
        />

        {/* 3. HR Payroll User Dashboard */}
        <Route
          path='/dashboard/hr-payroll-user'
          element={
            <AppLayout
              roleId='hr-payroll-user'
              title='Payroll Operations'
              portalName='Payroll User Portal'
              user={HR_PAYROLL_USER_DATA.user}
            >
              <HRPayrollUserDashboardPage />
            </AppLayout>
          }
        />

        {/* 4. HR Payroll Manager Dashboard */}
        <Route
          path='/dashboard/hr-payroll-manager'
          element={
            <AppLayout
              roleId='hr-payroll-manager'
              title='Payroll Manager'
              portalName='Payroll Manager Portal'
              user={HR_PAYROLL_MANAGER_DATA.user}
            >
              <HRPayrollManagerDashboardPage />
            </AppLayout>
          }
        />

        {/* 5. Admin Dashboard */}
        <Route
          path='/dashboard/admin'
          element={
            <AppLayout
              roleId='admin'
              title='Administration'
              portalName='Administrator Portal'
              user={ADMIN_DATA.user}
            >
              <AdminDashboardPage />
            </AppLayout>
          }
        />
      </Route>

      {/* Catch-all Fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
