import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ADMIN_DATA } from '../data/adminDashboardData.js';
import { EMPLOYEE_DATA } from '../data/employeeDashboardData.js';
import { HR_MANAGER_DATA } from '../data/hrManagerDashboardData.js';
import { HR_PAYROLL_MANAGER_DATA } from '../data/hrPayrollManagerDashboardData.js';
import { HR_PAYROLL_USER_DATA } from '../data/hrPayrollUserDashboardData.js';
import AppLayout from '../layouts/AppLayout.jsx';
import { selectCurrentRole, selectCurrentUser } from '../redux/selectors/authSelectors.js';

// Public & Auth Pages
import LandingPage from '../pages/public/LandingPage.jsx';
import EmployeeLoginPage from '../pages/auth/EmployeeLoginPage.jsx';
import HRManagerLoginPage from '../pages/auth/HRManagerLoginPage.jsx';
import HRPayrollUserLoginPage from '../pages/auth/HRPayrollUserLoginPage.jsx';
import HRPayrollManagerLoginPage from '../pages/auth/HRPayrollManagerLoginPage.jsx';
import AdminLoginPage from '../pages/auth/AdminLoginPage.jsx';
import LoginOTPPage from '../pages/auth/LoginOTPPage.jsx';
import AuthSessionProvider from '../components/auth/AuthSessionProvider.jsx';

// Role Dashboards
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage.jsx';
import HRManagerDashboardPage from '../pages/hr-manager/HRManagerDashboardPage.jsx';
import HRPayrollUserDashboardPage from '../pages/hr-payroll-user/HRPayrollUserDashboardPage.jsx';
import HRPayrollManagerDashboardPage from '../pages/hr-payroll-manager/HRPayrollManagerDashboardPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';

// Feature Modules
import EmployeesPage from '../pages/hr-manager/EmployeesPage.jsx';
import EmployeeDetailPage from '../pages/hr-manager/EmployeeDetailPage.jsx';
import ContractsPage from '../pages/contracts/ContractsPage.jsx';
import SchedulesPage from '../pages/schedules/SchedulesPage.jsx';
import AttendancePage from '../pages/attendance/AttendancePage.jsx';
import TimeOffPage from '../pages/time-off/TimeOffPage.jsx';
import SalaryStructuresPage from '../pages/salary/SalaryStructuresPage.jsx';
import SalaryRulesPage from '../pages/salary/SalaryRulesPage.jsx';
import PayrunsPage from '../pages/payroll/PayrunsPage.jsx';
import PayslipsPage from '../pages/payslips/PayslipsPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';

// Admin & Self-Service Pages
import UsersPage from '../pages/admin/UsersPage.jsx';
import DepartmentsPage from '../pages/admin/DepartmentsPage.jsx';
import SettingsPage from '../pages/admin/SettingsPage.jsx';
import AuditLogsPage from '../pages/admin/AuditLogsPage.jsx';
import ProfilePage from '../pages/employee/ProfilePage.jsx';

// Guards
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import PublicRoutes from './PublicRoutes.jsx';

/**
 * Reusable layout shell connected to active Redux user state.
 */
function AppShell({ children, title, activeNav }) {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const currentUser = useSelector(selectCurrentUser);
  const normalizedRole = currentRole.replace('_', '-');

  const defaultUser =
    currentUser ||
    (normalizedRole === 'admin'
      ? ADMIN_DATA.user
      : normalizedRole === 'hr-manager'
      ? HR_MANAGER_DATA.user
      : normalizedRole === 'hr-payroll-manager'
      ? HR_PAYROLL_MANAGER_DATA.user
      : normalizedRole === 'hr-payroll-user'
      ? HR_PAYROLL_USER_DATA.user
      : EMPLOYEE_DATA.user);

  return (
    <AppLayout
      roleId={normalizedRole}
      title={title}
      user={defaultUser}
      activeNav={activeNav}
    >
      {children}
    </AppLayout>
  );
}

export default function AppRoutes() {
  return (
    <AuthSessionProvider>
      <Routes>
        {/* Public Landing & Login Pages */}
        <Route element={<PublicRoutes />}>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login/employee' element={<EmployeeLoginPage />} />
          <Route path='/login/hr-manager' element={<HRManagerLoginPage />} />
          <Route path='/login/hr-payroll-user' element={<HRPayrollUserLoginPage />} />
          <Route path='/login/hr-payroll-manager' element={<HRPayrollManagerLoginPage />} />
          <Route path='/login/admin' element={<AdminLoginPage />} />
          <Route path='/login/verify-otp' element={<LoginOTPPage />} />
        </Route>

      {/* Authenticated Routes with ProtectedRoute Guard */}
      <Route element={<ProtectedRoute />}>
        {/* 1. Employee Dashboard */}
        <Route element={<RoleRoute allowedRoles={['employee']} />}>
          <Route
            path='/dashboard/employee'
            element={
              <AppShell title='Employee Dashboard' activeNav='dashboard'>
                <EmployeeDashboardPage />
              </AppShell>
            }
          />
        </Route>

        {/* 2. HR Manager Dashboard */}
        <Route element={<RoleRoute allowedRoles={['hr_manager']} />}>
          <Route
            path='/dashboard/hr-manager'
            element={
              <AppShell title='HR Manager Dashboard' activeNav='dashboard'>
                <HRManagerDashboardPage />
              </AppShell>
            }
          />
        </Route>

        {/* 3. HR Payroll User Dashboard */}
        <Route element={<RoleRoute allowedRoles={['hr_payroll_user']} />}>
          <Route
            path='/dashboard/hr-payroll-user'
            element={
              <AppShell title='Payroll Operations' activeNav='dashboard'>
                <HRPayrollUserDashboardPage />
              </AppShell>
            }
          />
        </Route>

        {/* 4. HR Payroll Manager Dashboard */}
        <Route element={<RoleRoute allowedRoles={['hr_payroll_manager']} />}>
          <Route
            path='/dashboard/hr-payroll-manager'
            element={
              <AppShell title='Payroll Manager' activeNav='dashboard'>
                <HRPayrollManagerDashboardPage />
              </AppShell>
            }
          />
        </Route>

        {/* 5. Admin Dashboard */}
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route
            path='/dashboard/admin'
            element={
              <AppShell title='Administration' activeNav='dashboard'>
                <AdminDashboardPage />
              </AppShell>
            }
          />
        </Route>

        {/* Self-Service Profile (Accessible to all authenticated users) */}
        <Route
          path='/profile'
          element={
            <AppShell title='My Profile' activeNav='profile'>
              <ProfilePage />
            </AppShell>
          }
        />

        {/* Employee Management: HR Manager, HR Payroll Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['hr_manager', 'hr_payroll_manager', 'admin']} />}>
          <Route
            path='/employees'
            element={
              <AppShell title='Employees' activeNav='employees'>
                <EmployeesPage />
              </AppShell>
            }
          />
          <Route
            path='/employees/:employeeId'
            element={
              <AppShell title='Employee Profile' activeNav='employees'>
                <EmployeeDetailPage />
              </AppShell>
            }
          />
        </Route>

        {/* Contracts: Employee (self), HR Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['employee', 'hr_manager', 'admin']} />}>
          <Route
            path='/contracts'
            element={
              <AppShell title='Contracts' activeNav='contracts'>
                <ContractsPage />
              </AppShell>
            }
          />
        </Route>

        {/* Working Schedules: HR Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['hr_manager', 'admin']} />}>
          <Route
            path='/schedules'
            element={
              <AppShell title='Working Schedules' activeNav='schedules'>
                <SchedulesPage />
              </AppShell>
            }
          />
        </Route>

        {/* Attendance: Employee (punch), HR Manager, HR Payroll User, Admin */}
        <Route element={<RoleRoute allowedRoles={['employee', 'hr_manager', 'hr_payroll_user', 'admin']} />}>
          <Route
            path='/attendance'
            element={
              <AppShell title='Attendance' activeNav='attendance'>
                <AttendancePage />
              </AppShell>
            }
          />
        </Route>

        {/* Time Off: Employee, HR Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['employee', 'hr_manager', 'admin']} />}>
          <Route
            path='/time-off'
            element={
              <AppShell title='Time Off' activeNav='time-off'>
                <TimeOffPage />
              </AppShell>
            }
          />
        </Route>

        {/* Salary Structures & Rules: HR Payroll User, HR Payroll Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
          <Route
            path='/salary-structures'
            element={
              <AppShell title='Salary Structures' activeNav='salary-structures'>
                <SalaryStructuresPage />
              </AppShell>
            }
          />
          <Route
            path='/salary-rules'
            element={
              <AppShell title='Salary Rules' activeNav='salary-rules'>
                <SalaryRulesPage />
              </AppShell>
            }
          />
        </Route>

        {/* Payruns: HR Payroll User, HR Payroll Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
          <Route
            path='/payruns'
            element={
              <AppShell title='Payruns' activeNav='payruns'>
                <PayrunsPage />
              </AppShell>
            }
          />
        </Route>

        {/* Payslips: Employee, HR Payroll User, HR Payroll Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['employee', 'hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
          <Route
            path='/payslips'
            element={
              <AppShell title='Payslips' activeNav='payslips'>
                <PayslipsPage />
              </AppShell>
            }
          />
        </Route>

        {/* Reports: HR Manager, HR Payroll Manager, Admin */}
        <Route element={<RoleRoute allowedRoles={['hr_manager', 'hr_payroll_manager', 'admin']} />}>
          <Route
            path='/reports'
            element={
              <AppShell title='Executive Reports' activeNav='reports'>
                <ReportsPage />
              </AppShell>
            }
          />
        </Route>

        {/* Admin Only Routes */}
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route
            path='/users'
            element={
              <AppShell title='User Management' activeNav='users'>
                <UsersPage />
              </AppShell>
            }
          />
          <Route
            path='/departments'
            element={
              <AppShell title='Departments' activeNav='departments'>
                <DepartmentsPage />
              </AppShell>
            }
          />
          <Route
            path='/settings'
            element={
              <AppShell title='System Settings' activeNav='settings'>
                <SettingsPage />
              </AppShell>
            }
          />
          <Route
            path='/audit-logs'
            element={
              <AppShell title='Audit Logs' activeNav='audit-logs'>
                <AuditLogsPage />
              </AppShell>
            }
          />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  </AuthSessionProvider>
  );
}
