import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import dashboardApi from '../../services/dashboardApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState(null);
  const [departmentCost, setDepartmentCost] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [attendanceOverview, setAttendanceOverview] = useState(null);
  const [timeOffOverview, setTimeOffOverview] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, deptRes, trendRes, attRes, timeOffRes] = await Promise.allSettled([
        dashboardApi.getKPIs(),
        dashboardApi.getSalaryByDepartment(),
        dashboardApi.getMonthlyTrends({ months: 6 }),
        dashboardApi.getAttendanceOverview(),
        dashboardApi.getTimeOffOverview(),
      ]);

      if (kpiRes.status === 'fulfilled') {
        setKpis(kpiRes.value?.data || null);
      }
      if (deptRes.status === 'fulfilled') {
        setDepartmentCost(deptRes.value?.data || []);
      }
      if (trendRes.status === 'fulfilled') {
        setMonthlyTrend(trendRes.value?.data || []);
      }
      if (attRes.status === 'fulfilled') {
        setAttendanceOverview(attRes.value?.data || null);
      }
      if (timeOffRes.status === 'fulfilled') {
        setTimeOffOverview(timeOffRes.value?.data || null);
      }

      if (
        kpiRes.status === 'rejected' &&
        deptRes.status === 'rejected' &&
        trendRes.status === 'rejected'
      ) {
        setError('Failed to load reports data.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load reports.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Format month from date string
  const formatMonth = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Executive Reports & Analytics'
        subtitle='Consolidated workforce analytics, payroll trends, and attendance health.'
        actions={
          <button
            type='button'
            onClick={loadReports}
            disabled={loading}
            className='px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border rounded-xl cursor-pointer disabled:opacity-50'
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Loading reports...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReports} />
      ) : (
        <div className='space-y-6'>
          {/* KPI Strip */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='bg-white rounded-2xl p-4 border space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>Total Net Payroll</div>
              <div className='text-2xl font-black'>{formatCurrency(kpis?.totalNetSalary || 0)}</div>
              <div className='text-[11px] text-emerald-700'>{kpis?.payslipCount || 0} payslips</div>
            </div>

            <div className='bg-white rounded-2xl p-4 border space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>Average Salary</div>
              <div className='text-2xl font-black text-[#714B67]'>{formatCurrency(kpis?.averageSalary || 0)}</div>
              <div className='text-[11px] text-gray-500'>{kpis?.totalEmployees || 0} employees</div>
            </div>

            <div className='bg-white rounded-2xl p-4 border space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>Attendance Health</div>
              <div className='text-2xl font-black text-emerald-700'>{kpis?.attendanceHealth || '0%'}</div>
              <div className='text-[11px] text-gray-500'>
                {kpis?.attendanceBreakdown?.present || 0} of {kpis?.attendanceBreakdown?.total || 0} present
              </div>
            </div>

            <div className='bg-white rounded-2xl p-4 border space-y-1.5'>
              <div className='text-[10px] uppercase font-bold text-gray-400'>Approved Time Off</div>
              <div className='text-2xl font-black text-blue-700'>{kpis?.approvedTimeOffDays || 0} Days</div>
              <div className='text-[11px] text-gray-500'>{kpis?.pendingRequests || 0} pending</div>
            </div>
          </div>

          {/* Charts */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Monthly Trend */}
            <div className='bg-white rounded-2xl p-5 border space-y-4'>
              <h3 className='text-sm font-black border-b pb-2.5'>Monthly Payroll Trend</h3>
              {monthlyTrend.length === 0 ? (
                <p className='text-xs text-gray-400 py-8 text-center'>No trend data available.</p>
              ) : (
                <div className='space-y-3'>
                  {monthlyTrend.slice(-6).map((item, idx) => (
                    <div key={idx} className='space-y-1'>
                      <div className='flex justify-between text-xs font-bold'>
                        <span>{formatMonth(item.month)}</span>
                        <span>{formatCurrency(item.totalNetSalary)}</span>
                      </div>
                      <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#714B67] rounded-full'
                          style={{
                            width: `${Math.min(100, (item.totalNetSalary / (kpis?.totalNetSalary || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Cost */}
            <div className='bg-white rounded-2xl p-5 border space-y-4'>
              <h3 className='text-sm font-black border-b pb-2.5'>Department Payroll Allocation</h3>
              {departmentCost.length === 0 ? (
                <p className='text-xs text-gray-400 py-8 text-center'>No department data available.</p>
              ) : (
                <div className='space-y-3'>
                  {departmentCost.map((dept) => (
                    <div key={dept.departmentId} className='space-y-1'>
                      <div className='flex justify-between text-xs font-bold'>
                        <span>{dept.departmentName}</span>
                        <span>{formatCurrency(dept.totalNetSalary)}</span>
                      </div>
                      <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#714B67] rounded-full'
                          style={{
                            width: `${Math.min(100, (dept.totalNetSalary / (kpis?.totalNetSalary || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attendance & Time Off */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            <div className='bg-white rounded-2xl p-5 border space-y-3'>
              <h3 className='text-sm font-black border-b pb-2.5'>Attendance Overview</h3>
              <div className='grid grid-cols-3 gap-2 text-center'>
                <div className='p-3 rounded-xl bg-emerald-50 border border-emerald-200'>
                  <div className='text-xs font-bold text-emerald-800'>Present</div>
                  <div className='text-xl font-black'>{attendanceOverview?.presentCount || 0}</div>
                </div>
                <div className='p-3 rounded-xl bg-amber-50 border border-amber-200'>
                  <div className='text-xs font-bold text-amber-800'>Manual Edits</div>
                  <div className='text-xl font-black'>{attendanceOverview?.manualEdits || 0}</div>
                </div>
                <div className='p-3 rounded-xl bg-rose-50 border border-rose-200'>
                  <div className='text-xs font-bold text-rose-800'>Missing Checkouts</div>
                  <div className='text-xl font-black'>{attendanceOverview?.missingCheckouts || 0}</div>
                </div>
              </div>
              <div className='text-xs text-gray-500'>
                Total records: <strong>{attendanceOverview?.totalRecords || 0}</strong> • Health: <strong>{attendanceOverview?.attendanceHealth || '0%'}</strong>
              </div>
            </div>

            <div className='bg-white rounded-2xl p-5 border space-y-3'>
              <h3 className='text-sm font-black border-b pb-2.5'>Time Off Overview</h3>
              <div className='grid grid-cols-2 gap-2 text-center'>
                <div className='p-3 rounded-xl bg-emerald-50 border border-emerald-200'>
                  <div className='text-xs font-bold text-emerald-800'>Approved Days</div>
                  <div className='text-xl font-black'>{timeOffOverview?.approvedDays || 0}</div>
                </div>
                <div className='p-3 rounded-xl bg-amber-50 border border-amber-200'>
                  <div className='text-xs font-bold text-amber-800'>Pending</div>
                  <div className='text-xl font-black'>{timeOffOverview?.pendingRequests || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}