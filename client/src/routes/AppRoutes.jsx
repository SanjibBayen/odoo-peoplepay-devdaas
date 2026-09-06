import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
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
import SetPasswordPage from '../pages/auth/SetPasswordPage.jsx';
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
import ContractFormPage from '../pages/contracts/ContractFormPage.jsx';
import ContractDetailPage from '../pages/contracts/ContractDetailPage.jsx';
import SchedulesPage from '../pages/schedules/SchedulesPage.jsx';
import ScheduleFormPage from '../pages/schedules/ScheduleFormPage.jsx';
import AttendancePage from '../pages/attendance/AttendancePage.jsx';
import TimeOffPage from '../pages/time-off/TimeOffPage.jsx';
import TimeOffRequestsPage from '../pages/time-off/TimeOffRequestsPage.jsx';
import TimeOffAllocationsPage from '../pages/time-off/TimeOffAllocationsPage.jsx';
import TimeOffTypesPage from '../pages/time-off/TimeOffTypesPage.jsx';
import SalaryStructuresPage from '../pages/salary/SalaryStructuresPage.jsx';
import SalaryStructureFormPage from '../pages/salary/SalaryStructureFormPage.jsx';
import SalaryRulesPage from '../pages/salary/SalaryRulesPage.jsx';
import SalaryRuleFormPage from '../pages/salary/SalaryRuleFormPage.jsx';
import PayrunsPage from '../pages/payroll/PayrunsPage.jsx';
import PayrunWizardPage from '../pages/payroll/PayrunWizardPage.jsx';
import PayrunDetailPage from '../pages/payroll/PayrunDetailPage.jsx';
import PayslipsPage from '../pages/payslips/PayslipsPage.jsx';
import PayslipDetailPage from '../pages/payslips/PayslipDetailPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';

// Admin & Self-Service Pages
import UsersPage from '../pages/admin/UsersPage.jsx';
import AddEmployeePage from '../pages/admin/AddEmployeePage.jsx';
import DepartmentsPage from '../pages/admin/DepartmentsPage.jsx';
import SettingsPage from '../pages/admin/SettingsPage.jsx';
import AuditLogsPage from '../pages/admin/AuditLogsPage.jsx';
import ProfilePage from '../pages/employee/ProfilePage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import AccessDeniedPage from '../pages/public/AccessDeniedPage.jsx';

// Guards
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import PublicRoutes from './PublicRoutes.jsx';

function AppShell({ children, title, activeNav }) {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const currentUser = useSelector(selectCurrentUser);

  return (
    <AppLayout
      roleId={currentRole.replace('_', '-')}
      title={title}
      user={currentUser}
      activeNav={activeNav}
    >
      {children}
    </AppLayout>
  );
}

function DashboardRedirect() {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const roleSlug = currentRole.toLowerCase().replace(/_/g, '-');
  return <Navigate to={`/dashboard/${roleSlug}`} replace />;
}

export default function AppRoutes() {
  return (
    <AuthSessionProvider>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoutes />}>
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<EmployeeLoginPage />} />
          <Route path='/login/employee' element={<EmployeeLoginPage />} />
          <Route path='/login/hr-manager' element={<HRManagerLoginPage />} />
          <Route path='/login/hr-payroll-user' element={<HRPayrollUserLoginPage />} />
          <Route path='/login/hr-payroll-manager' element={<HRPayrollManagerLoginPage />} />
          <Route path='/login/admin' element={<AdminLoginPage />} />
          <Route path='/login/verify-otp' element={<LoginOTPPage />} />
          <Route path='/set-password' element={<SetPasswordPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Universal Dashboard Redirect */}
          <Route path='/dashboard' element={<DashboardRedirect />} />

          {/* Access Denied Page */}
          <Route path='/access-denied' element={<AccessDeniedPage />} />

          {/* Canonical & Convenience Route Aliases */}
          <Route path='/employees/new' element={<Navigate to='/employees/add' replace />} />
          <Route path='/admin/add-employee' element={<Navigate to='/employees/add' replace />} />
          <Route path='/payroll/payruns' element={<Navigate to='/payruns' replace />} />
          <Route path='/payroll/payruns/new' element={<Navigate to='/payruns/new' replace />} />
          <Route path='/salary/structures' element={<Navigate to='/salary-structures' replace />} />
          <Route path='/salary/rules' element={<Navigate to='/salary-rules' replace />} />
          
          {/* ============ EMPLOYEE ROUTES ============ */}
          <Route element={<RoleRoute allowedRoles={['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/employee/dashboard' element={<AppShell title='Dashboard' activeNav='dashboard'><EmployeeDashboardPage /></AppShell>} />
            <Route path='/dashboard/employee' element={<AppShell title='Dashboard' activeNav='dashboard'><EmployeeDashboardPage /></AppShell>} />
            <Route path='/profile' element={<AppShell title='My Profile' activeNav='profile'><ProfilePage /></AppShell>} />
            <Route path='/employee/profile' element={<AppShell title='My Profile' activeNav='profile'><ProfilePage /></AppShell>} />
            <Route path='/attendance' element={<AppShell title='Attendance' activeNav='attendance'><AttendancePage /></AppShell>} />
            <Route path='/employee/attendance' element={<AppShell title='Attendance' activeNav='attendance'><AttendancePage /></AppShell>} />
            <Route path='/time-off' element={<AppShell title='Time Off' activeNav='time-off'><TimeOffPage /></AppShell>} />
            <Route path='/employee/time-off' element={<AppShell title='Time Off' activeNav='time-off'><TimeOffPage /></AppShell>} />
            <Route path='/payslips' element={<AppShell title='Payslips' activeNav='payslips'><PayslipsPage /></AppShell>} />
            <Route path='/payslips/:id' element={<AppShell title='Payslip' activeNav='payslips'><PayslipDetailPage /></AppShell>} />
            <Route path='/employee/payslips' element={<AppShell title='Payslips' activeNav='payslips'><PayslipsPage /></AppShell>} />
          </Route>

          {/* ============ HR MANAGER ROUTES ============ */}
          <Route element={<RoleRoute allowedRoles={['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/hr-manager/dashboard' element={<AppShell title='HR Manager' activeNav='dashboard'><HRManagerDashboardPage /></AppShell>} />
            <Route path='/dashboard/hr-manager' element={<AppShell title='HR Manager' activeNav='dashboard'><HRManagerDashboardPage /></AppShell>} />
            <Route path='/employees' element={<AppShell title='Employees' activeNav='employees'><EmployeesPage /></AppShell>} />
            <Route path='/employees/:employeeId' element={<AppShell title='Employee Details' activeNav='employees'><EmployeeDetailPage /></AppShell>} />
            <Route path='/employees/add' element={<AppShell title='Add Employee' activeNav='employees'><AddEmployeePage /></AppShell>} />
            <Route path='/schedules' element={<AppShell title='Schedules' activeNav='schedules'><SchedulesPage /></AppShell>} />
            <Route path='/schedules/new' element={<AppShell title='New Schedule' activeNav='schedules'><ScheduleFormPage /></AppShell>} />
            <Route path='/schedules/:id/edit' element={<AppShell title='Edit Schedule' activeNav='schedules'><ScheduleFormPage /></AppShell>} />
            <Route path='/time-off/requests' element={<AppShell title='Leave Requests' activeNav='time-off'><TimeOffRequestsPage /></AppShell>} />
            <Route path='/time-off/allocations' element={<AppShell title='Allocations' activeNav='time-off'><TimeOffAllocationsPage /></AppShell>} />
            <Route path='/time-off/types' element={<AppShell title='Leave Types' activeNav='time-off'><TimeOffTypesPage /></AppShell>} />
          </Route>

          {/* ============ CONTRACTS (All authenticated roles) ============ */}
          <Route element={<RoleRoute allowedRoles={['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/contracts' element={<AppShell title='Contracts' activeNav='contracts'><ContractsPage /></AppShell>} />
            <Route path='/contracts/new' element={<AppShell title='New Contract' activeNav='contracts'><ContractFormPage /></AppShell>} />
            <Route path='/contracts/:id' element={<AppShell title='Contract Details' activeNav='contracts'><ContractDetailPage /></AppShell>} />
            <Route path='/contracts/:id/edit' element={<AppShell title='Edit Contract' activeNav='contracts'><ContractFormPage /></AppShell>} />
          </Route>

          {/* ============ HR PAYROLL USER ROUTES ============ */}
          <Route element={<RoleRoute allowedRoles={['hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/hr-payroll-user/dashboard' element={<AppShell title='Payroll Ops' activeNav='dashboard'><HRPayrollUserDashboardPage /></AppShell>} />
            <Route path='/dashboard/hr-payroll-user' element={<AppShell title='Payroll Ops' activeNav='dashboard'><HRPayrollUserDashboardPage /></AppShell>} />
            <Route path='/salary-structures' element={<AppShell title='Salary Structures' activeNav='salary'><SalaryStructuresPage /></AppShell>} />
            <Route path='/salary-structures/new' element={<AppShell title='New Structure' activeNav='salary'><SalaryStructureFormPage /></AppShell>} />
            <Route path='/salary-structures/:id/edit' element={<AppShell title='Edit Structure' activeNav='salary'><SalaryStructureFormPage /></AppShell>} />
            <Route path='/salary-rules' element={<AppShell title='Salary Rules' activeNav='salary'><SalaryRulesPage /></AppShell>} />
            <Route path='/salary-rules/new' element={<AppShell title='New Rule' activeNav='salary'><SalaryRuleFormPage /></AppShell>} />
            <Route path='/salary-rules/:id/edit' element={<AppShell title='Edit Rule' activeNav='salary'><SalaryRuleFormPage /></AppShell>} />
          </Route>

          {/* ============ HR PAYROLL MANAGER ROUTES ============ */}
          <Route element={<RoleRoute allowedRoles={['hr_payroll_manager', 'admin']} />}>
            <Route path='/hr-payroll-manager/dashboard' element={<AppShell title='Payroll Manager' activeNav='dashboard'><HRPayrollManagerDashboardPage /></AppShell>} />
            <Route path='/dashboard/hr-payroll-manager' element={<AppShell title='Payroll Manager' activeNav='dashboard'><HRPayrollManagerDashboardPage /></AppShell>} />
          </Route>

          {/* ============ PAYRUNS ============ */}
          <Route element={<RoleRoute allowedRoles={['hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/payruns' element={<AppShell title='Payruns' activeNav='payruns'><PayrunsPage /></AppShell>} />
            <Route path='/payruns/new' element={<AppShell title='New Payrun' activeNav='payruns'><PayrunWizardPage /></AppShell>} />
            <Route path='/payruns/:id' element={<AppShell title='Payrun Details' activeNav='payruns'><PayrunDetailPage /></AppShell>} />
          </Route>

          {/* ============ REPORTS ============ */}
          <Route element={<RoleRoute allowedRoles={['hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin']} />}>
            <Route path='/reports' element={<AppShell title='Reports' activeNav='reports'><ReportsPage /></AppShell>} />
          </Route>

          {/* ============ ADMIN ROUTES ============ */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path='/admin/dashboard' element={<AppShell title='Admin' activeNav='dashboard'><AdminDashboardPage /></AppShell>} />
            <Route path='/dashboard/admin' element={<AppShell title='Admin' activeNav='dashboard'><AdminDashboardPage /></AppShell>} />
            <Route path='/users' element={<AppShell title='Users' activeNav='users'><UsersPage /></AppShell>} />
            <Route path='/departments' element={<AppShell title='Departments' activeNav='departments'><DepartmentsPage /></AppShell>} />
            <Route path='/settings' element={<AppShell title='Settings' activeNav='settings'><SettingsPage /></AppShell>} />
            <Route path='/audit-logs' element={<AppShell title='Audit Logs' activeNav='audit-logs'><AuditLogsPage /></AppShell>} />
          </Route>

        </Route>

        {/* Catch-all 404 */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </AuthSessionProvider>
  );
}