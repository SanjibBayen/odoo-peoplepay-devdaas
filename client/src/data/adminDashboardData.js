/**
 * Mock data for the PeoplePay Admin Dashboard.
 */

export const ADMIN_DATA = {
  user: {
    firstName: 'System',
    lastName: 'Admin',
    fullName: 'System Administrator',
    email: 'admin@peoplepay.internal',
    role: 'Super Administrator',
    department: 'Platform Governance',
    employeeId: 'ADM-001',
    avatarInitials: 'SA',
  },

  kpis: [
    {
      id: 'total-users',
      label: 'Total Platform Users',
      value: '312',
      badgeText: '+18 this month',
      badgeType: 'blue',
      iconType: 'users',
      hint: 'Includes all 5 RBAC roles',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-200/70',
      iconBg: 'bg-blue-100/90 text-blue-700',
      valueColor: 'text-blue-950',
    },
    {
      id: 'active-employees',
      label: 'Managed Employees',
      value: '248',
      badgeText: 'Active',
      badgeType: 'emerald',
      iconType: 'user-check',
      hint: '100% contracts synchronized',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-200/70',
      iconBg: 'bg-emerald-100/90 text-emerald-700',
      valueColor: 'text-emerald-950',
    },
    {
      id: 'departments',
      label: 'Active Departments',
      value: '8',
      badgeText: 'Configured',
      badgeType: 'purple',
      iconType: 'building',
      hint: 'Across 3 geographic entities',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-purple-200/70',
      iconBg: 'bg-purple-100/90 text-[#714B67]',
      valueColor: 'text-purple-950',
    },
    {
      id: 'system-status',
      label: 'System Status',
      value: 'Healthy 99.9%',
      badgeText: 'Operational',
      badgeType: 'emerald',
      iconType: 'shield-check',
      hint: 'Biometric API & DB verified',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-200/70',
      iconBg: 'bg-emerald-100/90 text-emerald-700',
      valueColor: 'text-emerald-950',
    },
  ],

  roleDistribution: [
    {
      role: 'Employee',
      count: 248,
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'HR Manager',
      count: 6,
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      role: 'HR Payroll User',
      count: 8,
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      role: 'HR Payroll Manager',
      count: 4,
      badge: 'bg-purple-50 text-[#714B67] border-purple-200',
    },
    {
      role: 'Admin',
      count: 2,
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ],

  auditEvents: [
    {
      id: 'aud-1',
      action: 'Biometric Gateway Sync',
      user: 'Automated Job #cron-04',
      ip: '10.0.4.12',
      time: '12 mins ago',
      status: 'Success',
      detail: 'Reconciled 1,240 punches across 4 gateways',
    },
    {
      id: 'aud-2',
      action: 'Role Permission Elevation',
      user: 'admin@peoplepay.internal',
      ip: '192.168.1.45',
      time: '1 hour ago',
      status: 'Success',
      detail: 'Added Payroll Approval override permission to Elena Rodriguez',
    },
    {
      id: 'aud-3',
      action: 'Database Backup Completed',
      user: 'Backup Service',
      ip: '10.0.1.8',
      time: '04:00 AM',
      status: 'Success',
      detail: 'Encrypted snapshot archived to primary vault',
    },
    {
      id: 'aud-4',
      action: 'Failed Login Threshold',
      user: 'contractor.audit@external.com',
      ip: '103.24.8.19',
      time: 'Yesterday',
      status: 'Blocked',
      detail: 'Account locked after 5 invalid attempts',
    },
  ],

  configStatus: [
    {
      name: 'Multi-Factor Authentication',
      status: 'Enforced',
      detail: 'Required for HR & Admin roles',
    },
    {
      name: 'Biometric Gateway API',
      status: 'Connected',
      detail: 'Latency: 18ms • Gateway #1, #2 online',
    },
    {
      name: 'Direct Deposit Gateway',
      status: 'Connected',
      detail: 'HDFC Corporate Banking API active',
    },
    {
      name: 'Audit Log Retention',
      status: '365 Days',
      detail: 'Compliant with ISO 27001',
    },
  ],

  quickActions: [
    {
      id: 'manage-users',
      title: 'Users',
      subtitle: 'Create accounts, reset passwords, lockouts',
      iconType: 'users',
      accent: 'blue',
      badge: '312 Users',
    },
    {
      id: 'company-settings',
      title: 'Settings',
      subtitle: 'Fiscal calendar, shift timings, branding',
      iconType: 'sliders',
      accent: 'emerald',
      badge: 'Settings',
    },
    {
      id: 'view-audit-logs',
      title: 'Audit Logs',
      subtitle: 'Inspect immutable security & access trails',
      iconType: 'file-text',
      accent: 'amber',
      badge: 'Security',
    },
  ],
};
