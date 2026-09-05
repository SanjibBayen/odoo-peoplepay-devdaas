import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import reportApi from '../../services/reportApi.js';
import {
  ATTENDANCE_HEALTH_REPORT,
  DEPARTMENT_COST_REPORT,
  EMPLOYEE_STATS_REPORT,
  MONTHLY_TREND_REPORT,
  PAYROLL_COST_REPORT,
} from '../../data/reportsData.js';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [payrollCost, setPayrollCost] = useState(() => PAYROLL_COST_REPORT);
  const [monthlyTrend, setMonthlyTrend] = useState(() => MONTHLY_TREND_REPORT);
  const [departmentCost, setDepartmentCost] = useState(() => DEPARTMENT_COST_REPORT);
  const [attendanceHealth, setAttendanceHealth] = useState(() => ATTENDANCE_HEALTH_REPORT);
  const [employeeStats, setEmployeeStats] = useState(() => EMPLOYEE_STATS_REPORT);

  const loadReports = () => {
    Promise.all([
      reportApi.getPayrollCostReport(),
      reportApi.getMonthlyTrendReport(),
      reportApi.getDepartmentCostReport(),
      reportApi.getAttendanceHealthReport(),
      reportApi.getEmployeeStatsReport(),
    ])
      .then(([costRes, trendRes, deptRes, attRes, empRes]) => {
        setPayrollCost(costRes.data);
        setMonthlyTrend(trendRes.data || []);
        setDepartmentCost(deptRes.data || []);
        setAttendanceHealth(attRes.data);
        setEmployeeStats(empRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load reports.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Executive Reports & Analytics'
        subtitle='Consolidated workforce analytics, payroll trend curves, and attendance health metrics.'
        actions={
          <button
            type='button'
            onClick={loadReports}
            className='px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-[#EAE6DF] rounded-xl shadow-2xs cursor-pointer'
          >
            Refresh Data
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Computing aggregated workforce metrics...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReports} />
      ) : (
        <div className='space-y-6'>
          {/* Top KPI Strip */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>
                Total Fiscal Payroll
              </div>
              <div className='text-2xl font-black text-[#1E293B]'>
                {payrollCost?.totalYearlyCost}
              </div>
              <div className='text-[11px] font-bold text-emerald-700'>
                {payrollCost?.fiscalYear} Budget Target
              </div>
            </div>

            <div className='bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>
                Monthly Run Rate
              </div>
              <div className='text-2xl font-black text-[#714B67]'>
                {payrollCost?.currentMonthCost}
              </div>
              <div className='text-[11px] text-gray-500'>
                Net Disbursal: {payrollCost?.netDisbursed}
              </div>
            </div>

            <div className='bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>
                Attendance Health Rate
              </div>
              <div className='text-2xl font-black text-emerald-700'>
                {attendanceHealth?.presentRate}%
              </div>
              <div className='text-[11px] text-gray-500'>
                Avg {attendanceHealth?.averageWorkHoursPerEmployee} hrs/emp
              </div>
            </div>

            <div className='bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>
                Total Headcount
              </div>
              <div className='text-2xl font-black text-blue-700'>
                {employeeStats?.totalEmployees}
              </div>
              <div className='text-[11px] text-gray-500'>
                {employeeStats?.activePermanent} Permanent • {employeeStats?.probation} Probation
              </div>
            </div>
          </div>

          {/* Section 1: Monthly Trend (Lightweight SVG Bar Chart) & Department Distribution */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Monthly Trend Chart */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
              <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
                <div>
                  <h3 className='text-sm font-black text-[#1E293B]'>
                    Monthly Payroll Trend (Last 6 Months)
                  </h3>
                  <p className='text-xs text-gray-500'>
                    Gross disbursed amounts in Crore INR
                  </p>
                </div>
                <span className='text-xs font-bold text-gray-400'>2026</span>
              </div>

              {/* Pure SVG Bar Chart */}
              <div className='h-48 w-full flex items-end justify-between gap-3 pt-4 px-2'>
                {monthlyTrend.map((item) => {
                  const maxVal = 1.5;
                  const heightPercent = Math.min(100, (item.amount / maxVal) * 100);
                  return (
                    <div
                      key={item.month}
                      className='flex-1 flex flex-col items-center gap-1.5 h-full justify-end group'
                    >
                      <span className='text-[10px] font-bold text-gray-500 group-hover:text-[#714B67] transition-colors'>
                        {item.label}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className='w-full max-w-[38px] bg-gradient-to-t from-[#714B67] to-[#8E6082] rounded-t-lg transition-all group-hover:opacity-85 shadow-xs'
                      />
                      <span className='text-xs font-bold text-gray-700 mt-1'>
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Cost Distribution (Clean Horizontal Bars) */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
              <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
                <div>
                  <h3 className='text-sm font-black text-[#1E293B]'>
                    Department Payroll Allocation
                  </h3>
                  <p className='text-xs text-gray-500'>
                    Share of monthly compensation budget
                  </p>
                </div>
                <span className='text-xs font-bold text-[#714B67]'>Sep 2026</span>
              </div>

              <div className='space-y-3.5 pt-2'>
                {departmentCost.map((dept) => (
                  <div key={dept.department} className='space-y-1 text-xs'>
                    <div className='flex items-center justify-between font-bold'>
                      <span className='text-gray-800'>{dept.department}</span>
                      <span className='text-gray-600'>{dept.cost} ({dept.percentage}%)</span>
                    </div>
                    <div className='h-2.5 w-full bg-[#FAF8F5] border border-gray-200/80 rounded-full overflow-hidden'>
                      <div
                        style={{ width: `${dept.percentage}%` }}
                        className='h-full bg-[#714B67] rounded-full'
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Attendance Health & Workforce Metrics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Attendance Health */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
              <h3 className='text-sm font-black text-[#1E293B] border-b border-gray-100 pb-2.5'>
                Workforce Attendance Reconciliation
              </h3>

              <div className='grid grid-cols-3 gap-3 text-center'>
                <div className='p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200'>
                  <div className='text-xs font-bold text-emerald-800'>Present</div>
                  <div className='text-xl font-black text-emerald-900 mt-1'>
                    {attendanceHealth?.presentRate}%
                  </div>
                </div>
                <div className='p-3.5 rounded-xl bg-amber-50/60 border border-amber-200'>
                  <div className='text-xs font-bold text-amber-800'>Late Arrival</div>
                  <div className='text-xl font-black text-amber-900 mt-1'>
                    {attendanceHealth?.lateRate}%
                  </div>
                </div>
                <div className='p-3.5 rounded-xl bg-rose-50/60 border border-rose-200'>
                  <div className='text-xs font-bold text-rose-800'>Absent / Leave</div>
                  <div className='text-xl font-black text-rose-900 mt-1'>
                    {attendanceHealth?.absentRate}%
                  </div>
                </div>
              </div>

              <div className='text-xs text-gray-500 font-medium pt-2'>
                Total hours tracked this month: <strong className='text-gray-800'>{attendanceHealth?.totalWorkHoursLogged?.toLocaleString()} hours</strong> across all active shifts.
              </div>
            </div>

            {/* Employee Statistics */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
              <h3 className='text-sm font-black text-[#1E293B] border-b border-gray-100 pb-2.5'>
                Workforce Tenure & Demographics
              </h3>

              <div className='divide-y divide-gray-100 text-xs space-y-2'>
                <div className='flex items-center justify-between pt-1'>
                  <span className='text-gray-600'>Average Organization Tenure</span>
                  <span className='font-bold text-gray-900'>{employeeStats?.averageTenure}</span>
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <span className='text-gray-600'>Gender Ratio</span>
                  <span className='font-bold text-gray-900'>{employeeStats?.genderRatio}</span>
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <span className='text-gray-600'>Contractors / External</span>
                  <span className='font-bold text-gray-900'>{employeeStats?.contractor} specialists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
