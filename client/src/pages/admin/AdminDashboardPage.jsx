import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import dashboardApi from '../../services/dashboardApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real backend dataset states
  const [kpis, setKpis] = useState(null);
  const [departmentSalaries, setDepartmentSalaries] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [timeOffOverview, setTimeOffOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Load all dashboard endpoints from real backend
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const [kpisRes, deptRes, trendsRes, attRes, timeOffRes, alertsRes] =
        await Promise.allSettled([
          dashboardApi.getKPIs(),
          dashboardApi.getSalaryByDepartment(),
          dashboardApi.getMonthlyTrends({ months: 12 }),
          dashboardApi.getAttendanceOverview(),
          dashboardApi.getTimeOffOverview(),
          dashboardApi.getAlerts(),
        ]);

      if (kpisRes.status === 'fulfilled') {
        setKpis(kpisRes.value?.data || null);
      }
      if (deptRes.status === 'fulfilled') {
        setDepartmentSalaries(deptRes.value?.data || []);
      }
      if (trendsRes.status === 'fulfilled') {
        setMonthlyTrends(trendsRes.value?.data || []);
      }
      if (attRes.status === 'fulfilled') {
        setAttendanceOverview(attRes.value?.data || null);
      }
      if (timeOffRes.status === 'fulfilled') {
        setTimeOffOverview(timeOffRes.value?.data || null);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value?.data || []);
      }

      // If all critical endpoints failed, report error
      if (
        kpisRes.status === 'rejected' &&
        deptRes.status === 'rejected' &&
        trendsRes.status === 'rejected'
      ) {
        setError(extractErrorMessage(kpisRes.reason, 'Unable to load dashboard data.'));
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load dashboard data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatMonth = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Safe value getters
  const totalEmployees = kpis?.totalEmployees ?? 0;
  const totalNetSalary = kpis?.totalNetSalary ?? 0;
  const payslipCount = kpis?.payslipCount ?? 0;
  const attendanceHealth = attendanceOverview?.attendanceHealth || kpis?.attendanceHealth || '0%';
  const presentCount = attendanceOverview?.presentCount ?? 0;
  const totalRecords = attendanceOverview?.totalRecords ?? 0;
  const approvedDays = timeOffOverview?.approvedDays ?? kpis?.approvedTimeOffDays ?? 0;
  const pendingRequests = timeOffOverview?.pendingRequests ?? 0;
  const manualEdits = attendanceOverview?.manualEdits ?? 0;
  const missingCheckouts = attendanceOverview?.missingCheckouts ?? 0;

  return (
    <div className='space-y-6'>
      {/* Compact Page Header */}
      <PageHeader
        title='System Administration'
        subtitle='Real-time workforce health, payroll disbursals, and operational governance.'
        handwrittenNote='Platform Governance'
        actions={
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className='px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-[#EAE6DF] rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50'
              title='Fetch latest data from server'
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type='button'
              onClick={() => navigate('/admin/employees/add')}
              className='px-3.5 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5'
            >
              <span className='text-sm leading-none'>+</span>
              <span>Add Employee</span>
            </button>
          </div>
        }
      />

      {/* Loading State */}
      {loading && <LoadingState message='Loading system administration dashboard...' />}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title='Unable to load dashboard data'
          message={error}
          onRetry={() => loadDashboardData(false)}
        />
      )}

      {/* Main Content when loaded */}
      {!loading && !error && (
        <>
          {/* 4 REAL BACKEND KPI CARDS */}
          <section aria-labelledby='admin-kpis-heading'>
            <h2 id='admin-kpis-heading' className='sr-only'>
              System KPIs
            </h2>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
              <StatCard
                label='Total Workforce'
                value={String(totalEmployees)}
                badgeText='Active Staff'
                hint={`${totalEmployees} active employees`}
                iconType='users'
                bgColor='bg-blue-50/50'
                borderColor='border-blue-200/70'
                iconBg='bg-blue-100/90 text-blue-700'
                valueColor='text-blue-950'
              />

              <StatCard
                label='Total Net Payroll'
                value={formatCurrency(totalNetSalary)}
                badgeText='Disbursed'
                hint={`${payslipCount} payslips processed`}
                iconType='trending-up'
                bgColor='bg-emerald-50/50'
                borderColor='border-emerald-200/70'
                iconBg='bg-emerald-100/90 text-emerald-700'
                valueColor='text-emerald-950'
              />

              <StatCard
                label='Attendance Health'
                value={attendanceHealth}
                badgeText='Punches'
                hint={`${presentCount} of ${totalRecords} records`}
                iconType='clock'
                bgColor='bg-purple-50/50'
                borderColor='border-purple-200/70'
                iconBg='bg-purple-100/90 text-[#714B67]'
                valueColor='text-purple-950'
              />

              <StatCard
                label='Time Off Approved'
                value={`${approvedDays} Days`}
                badgeText='Leave'
                hint={`${pendingRequests} pending review`}
                iconType='calendar'
                bgColor='bg-amber-50/50'
                borderColor='border-amber-200/70'
                iconBg='bg-amber-100/90 text-amber-800'
                valueColor='text-amber-950'
              />
            </div>
          </section>

          {/* MAIN TWO-COLUMN SECTION */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
            {/* Card 1: Department Salary & Headcount Breakdown */}
            <div className='lg:col-span-6'>
              <DashboardSection
                title='Department Payroll & Workforce'
                subtitle='Salary distribution and active headcount across departments'
                action={
                  <span className='text-[10px] text-gray-500 font-semibold'>
                    {departmentSalaries.length} Departments
                  </span>
                }
              >
                {departmentSalaries.length === 0 ? (
                  <EmptyState
                    title='No Department Salary Data'
                    description='No payroll records have been processed for departments yet.'
                  />
                ) : (
                  <div className='divide-y divide-gray-100'>
                    {departmentSalaries.map((dept) => (
                      <div
                        key={dept.departmentId || dept.departmentCode}
                        className='py-2.5 flex items-center justify-between gap-3 text-xs'
                      >
                        <div>
                          <div className='flex items-center gap-1.5'>
                            <span className='font-bold text-[#1E293B]'>{dept.departmentName}</span>
                            <span className='text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono'>
                              {dept.departmentCode}
                            </span>
                          </div>
                          <p className='text-[11px] text-gray-500 mt-0.5'>
                            {dept.headcount} {dept.headcount === 1 ? 'employee' : 'employees'} • Avg: {formatCurrency(dept.averageSalary)}
                          </p>
                        </div>
                        <div className='text-right shrink-0'>
                          <span className='font-bold text-[#1E293B] text-xs block'>
                            {formatCurrency(dept.totalNetSalary)}
                          </span>
                          <span className='text-[10px] text-gray-400'>
                            {dept.payslipCount} {dept.payslipCount === 1 ? 'payslip' : 'payslips'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardSection>
            </div>

            {/* Card 2: Operational & Payroll Alerts */}
            <div className='lg:col-span-6'>
              <DashboardSection
                title='Operational & Compliance Alerts'
                subtitle='Contract warnings, missing banking parameters, and exception flags'
                action={
                  <span className='text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                    {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
                  </span>
                }
              >
                {alerts.length === 0 ? (
                  <EmptyState
                    title='No Operational Alerts'
                    description='All employee records, contracts, and banking details are in full compliance.'
                  />
                ) : (
                  <div className='divide-y divide-gray-100 max-h-72 overflow-y-auto'>
                    {alerts.map((al, idx) => (
                      <div key={idx} className='py-2.5 flex items-start gap-2.5 text-xs'>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 border ${
                            al.severity === 'ERROR'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {al.severity || 'WARNING'}
                        </span>
                        <div className='min-w-0 flex-1'>
                          <p className='text-xs font-semibold text-[#1E293B]'>{al.message}</p>
                          {al.employeeName && (
                            <p className='text-[11px] text-gray-500 mt-0.5'>
                              Employee: <span className='font-medium'>{al.employeeName}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardSection>
            </div>
          </div>

          {/* SECONDARY SECTION: MONTHLY TRENDS & OPERATIONS OVERVIEW */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
            {/* Monthly Salary Trends */}
            <div className='lg:col-span-7'>
              <DashboardSection
                title='Monthly Disbursal Trends'
                subtitle='Real payroll expenditures recorded across monthly payruns'
                action={
                  <span className='text-[10px] text-gray-400 font-medium'>
                    Past 12 Months
                  </span>
                }
              >
                {monthlyTrends.length === 0 ? (
                  <EmptyState
                    title='No Monthly Trend Data'
                    description='Monthly disbursal data will appear here once payroll runs are validated.'
                  />
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                      <thead>
                        <tr className='border-b border-[#EAE6DF] text-gray-500 text-[10px] uppercase font-bold'>
                          <th className='py-2'>Month</th>
                          <th className='py-2'>Gross Payroll</th>
                          <th className='py-2'>Net Disbursed</th>
                          <th className='py-2 text-right'>Employees</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100'>
                        {monthlyTrends.map((tr, idx) => (
                          <tr key={idx} className='hover:bg-stone-50/50'>
                            <td className='py-2 font-bold text-[#1E293B]'>{formatMonth(tr.month)}</td>
                            <td className='py-2 text-gray-700'>{formatCurrency(tr.totalGrossSalary)}</td>
                            <td className='py-2 font-bold text-emerald-800'>{formatCurrency(tr.totalNetSalary)}</td>
                            <td className='py-2 text-right text-gray-600 font-mono'>{tr.employeeCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardSection>
            </div>

            {/* Attendance & Time Off Overview */}
            <div className='lg:col-span-5'>
              <DashboardSection
                title='Attendance & Leave Operations'
                subtitle='Operational health and recorded punch statistics'
              >
                <div className='space-y-3 text-xs'>
                  <div className='p-3 rounded-xl bg-purple-50/40 border border-purple-100 flex items-center justify-between'>
                    <div>
                      <p className='font-bold text-[#1E293B]'>Attendance Rate</p>
                      <p className='text-[11px] text-gray-500 mt-0.5'>
                        {presentCount} present of {totalRecords} total records
                      </p>
                    </div>
                    <span className='text-sm font-black text-[#714B67]'>
                      {attendanceHealth}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2.5'>
                    <div className='p-3 rounded-xl bg-stone-50 border border-stone-200/70'>
                      <span className='text-[10px] uppercase font-bold text-gray-500'>Manual Edits</span>
                      <p className='text-base font-black text-[#1E293B] mt-0.5'>
                        {manualEdits}
                      </p>
                      <span className='text-[10px] text-gray-400'>Supervisor corrections</span>
                    </div>

                    <div className='p-3 rounded-xl bg-stone-50 border border-stone-200/70'>
                      <span className='text-[10px] uppercase font-bold text-gray-500'>Missing Punches</span>
                      <p className='text-base font-black text-rose-700 mt-0.5'>
                        {missingCheckouts}
                      </p>
                      <span className='text-[10px] text-gray-400'>Missing checkout</span>
                    </div>
                  </div>

                  <div className='p-3 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between'>
                    <div>
                      <p className='font-bold text-[#1E293B]'>Pending Time Off</p>
                      <p className='text-[11px] text-gray-500 mt-0.5'>Requests awaiting managerial approval</p>
                    </div>
                    <span className='text-sm font-black text-amber-900'>
                      {pendingRequests}
                    </span>
                  </div>
                </div>
              </DashboardSection>
            </div>
          </div>

          {/* QUICK SHORTCUT ACTIONS */}
          <div className='space-y-2.5'>
            <div className='flex items-center justify-between px-1'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
                Quick System Shortcuts
              </h3>
              <span className='text-[10px] text-gray-400'>Administrator Controls</span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
              <QuickActionCard
                action={{
                  id: 'add-employee',
                  title: 'Add Employee',
                  subtitle: 'Onboard worker & send magic link',
                  iconType: 'user-plus',
                  accent: 'purple',
                  badge: 'Onboarding',
                }}
                onClick={() => navigate('/admin/employees/add')}
              />

              <QuickActionCard
                action={{
                  id: 'manage-users',
                  title: 'User Accounts',
                  subtitle: 'Manage roles and application users',
                  iconType: 'shield',
                  accent: 'blue',
                  badge: 'Security',
                }}
                onClick={() => navigate('/users')}
              />

              <QuickActionCard
                action={{
                  id: 'departments',
                  title: 'Departments',
                  subtitle: 'Configure teams & departments',
                  iconType: 'building',
                  accent: 'emerald',
                  badge: 'Organization',
                }}
                onClick={() => navigate('/departments')}
              />

              <QuickActionCard
                action={{
                  id: 'schedules',
                  title: 'Work Schedules',
                  subtitle: 'Shift hours and working calendars',
                  iconType: 'clock',
                  accent: 'amber',
                  badge: 'Operations',
                }}
                onClick={() => navigate('/schedules')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}