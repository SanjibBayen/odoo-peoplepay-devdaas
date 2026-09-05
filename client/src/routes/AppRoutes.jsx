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
import EmployeeDetailPage from '../pages/hr-manager/EmployeeDetailPage.jsx';
import EmployeesPage from '../pages/hr-manager/EmployeesPage.jsx';
import HRManagerDashboardPage from '../pages/hr-manager/HRManagerDashboardPage.jsx';
import HRPayrollManagerDashboardPage from '../pages/hr-payroll-manager/HRPayrollManagerDashboardPage.jsx';
import HRPayrollUserDashboardPage from '../pages/hr-payroll-user/HRPayrollUserDashboardPage.jsx';
import LandingPage from '../pages/public/LandingPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoutes from './PublicRoutes.jsx';

/**
 * Shell wrapper for Employee Management module accessible to HR Manager and Admin.
 */
function EmployeeManagementShell({ children, title = 'Employees' }) {
  const activeRole =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('peoplepay_role')
      : null;

  // Strict role check: If authenticated as Employee or Payroll user, redirect to own dashboard
  if (
    activeRole &&
    activeRole !== 'hr-manager' &&
    activeRole !== 'admin'
  ) {
    return <Navigate to={`/dashboard/${activeRole}`} replace />;
  }

  const roleId = activeRole === 'admin' ? 'admin' : 'hr-manager';
  const user = roleId === 'admin' ? ADMIN_DATA.user : HR_MANAGER_DATA.user;
  const portalName =
    roleId === 'admin' ? 'Administrator Portal' : 'HR Manager Portal';

  return (
    <AppLayout
      roleId={roleId}
      title={title}
      portalName={portalName}
      user={user}
      activeNav='employees'
    >
      {children}
    </AppLayout>
  );
}

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

        {/* 6. Employee Management Module (Accessible to HR Manager & Admin) */}
        <Route
          path='/employees'
          element={
            <EmployeeManagementShell title='Employees'>
              <EmployeesPage />
            </EmployeeManagementShell>
          }
        />
        <Route
          path='/employees/:employeeId'
          element={
            <EmployeeManagementShell title='Employee Profile'>
              <EmployeeDetailPage />
            </EmployeeManagementShell>
          }
        />
      </Route>

      {/* Catch-all Fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
