import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import AttendanceCard from '../../components/dashboard/AttendanceCard.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import UpcomingCard from '../../components/dashboard/UpcomingCard.jsx';
import { attendanceApi } from '../../services/attendanceApi.js';
import { timeOffApi } from '../../services/timeOffApi.js';
import { dashboardApi } from '../../services/dashboardApi.js';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * Compact, modern Employee Dashboard for PeoplePay.
 * 4 KPIs • 2 Main Content Cards • 3 Quick Actions
 */
export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    kpis: [],
    attendanceToday: null,
    upcoming: [],
    quickActions: [],
  });
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch employee dashboard data (correct endpoint)
        const dashboardRes = await dashboardApi.getEmployeeDashboard().catch(() => ({
          data: null,
        }));

        const data = dashboardRes?.data || null;

        // Build KPIs from employee dashboard data
        const kpis = data
          ? [
              {
                id: 1,
                label: 'Attendance Rate',
                value: `${data.metrics?.attendanceRate ?? 100}%`,
                badgeText:
                  data.metrics?.presentDays > 0 ? '+ On Track' : 'No Records',
                hint: `${data.metrics?.presentDays ?? 0} days present`,
                iconType: 'check',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-200',
                iconBg: 'bg-emerald-100',
                valueColor: 'text-emerald-700',
              },
              {
                id: 2,
                label: 'Leave Balance',
                value: `${data.metrics?.leaveBalance ?? 0} Days`,
                badgeText: 'Available',
                hint: 'Annual leave',
                iconType: 'calendar',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                iconBg: 'bg-blue-100',
                valueColor: 'text-blue-700',
              },
              {
                id: 3,
                label: 'Pending Requests',
                value: `${data.metrics?.pendingRequests ?? 0}`,
                badgeText: 'Awaiting',
                hint: 'Time off requests',
                iconType: 'clock',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                iconBg: 'bg-amber-100',
                valueColor: 'text-amber-700',
              },
              {
                id: 4,
                label: 'Today Status',
                value: data.today?.attendance?.status || 'No Check-in',
                badgeText: data.today?.attendance ? 'Logged' : 'Pending',
                hint: data.today?.attendance?.checkIn
                  ? `In: ${new Date(data.today.attendance.checkIn).toLocaleTimeString()}`
                  : 'Not checked in',
                iconType: 'user',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                iconBg: 'bg-purple-100',
                valueColor: 'text-purple-700',
              },
            ]
          : [];

        // Build attendance card data
        const attendanceToday = data?.today?.attendance
          ? {
              checkIn: data.today.attendance.checkIn,
              checkOut: data.today.attendance.checkOut,
              status: data.today.attendance.status,
              workedMinutes: data.today.attendance.workedMinutes || 0,
              lateMinutes: data.today.attendance.lateMinutes || 0,
              schedule: data.today.schedule,
            }
          : null;

        // Build upcoming leaves from pending requests
        const upcomingLeaves = (data?.pendingRequests || [])
          .filter((r) => new Date(r.startDate) >= new Date())
          .slice(0, 3)
          .map((r) => ({
            id: r.id,
            title: r.type || 'Leave',
            subtitle: `${r.startDate} to ${r.endDate}`,
            status: r.status,
          }));

        // Build quick actions
        const quickActions = [
          {
            id: 1,
            title: 'Check In',
            subtitle: 'Mark your attendance for today',
            iconType: 'login',
          },
          {
            id: 2,
            title: 'Request Time Off',
            subtitle: 'Submit a leave request',
            iconType: 'calendar',
          },
          {
            id: 3,
            title: 'View Payslips',
            subtitle: 'Access your salary slips',
            iconType: 'document',
          },
        ];

        setDashboardData({
          kpis,
          attendanceToday,
          upcoming: upcomingLeaves,
          quickActions,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const { kpis, attendanceToday, upcoming, quickActions } = dashboardData;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-400 text-sm'>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-red-500 text-sm'>{error}</div>
      </div>
    );
  }

  const firstName = user?.firstName || 'there';

  return (
    <div className='space-y-5'>
      {/* Compact Page Header */}
      <PageHeader
        title={`Good morning, ${firstName}`}
        subtitle="Here's what's happening with your work today."
        handwrittenNote='Your work, all in one place.'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            ● Shift Active
          </span>
        }
      />

      {/* 4 Compact KPI Cards */}
      <section aria-labelledby='kpi-heading'>
        <h2 id='kpi-heading' className='sr-only'>
          Key Metrics
        </h2>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          {kpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              badgeText={kpi.badgeText}
              hint={kpi.hint}
              iconType={kpi.iconType}
              bgColor={kpi.bgColor}
              borderColor={kpi.borderColor}
              iconBg={kpi.iconBg}
              valueColor={kpi.valueColor}
            />
          ))}
        </div>
      </section>

      {/* 2 Main Content Cards: Attendance & Upcoming */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        <div className='lg:col-span-7'>
          <AttendanceCard attendance={attendanceToday} />
        </div>
        <div className='lg:col-span-5'>
          <UpcomingCard items={upcoming} />
        </div>
      </div>

      {/* 3 Quick Actions */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Quick Actions
          </h3>
          <span className='text-[10px] text-gray-400'>Self-Service</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => setModalAction(action)}
            />
          ))}
        </div>
      </div>

      {/* Quick Action Modal Dialog */}
      {modalAction && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
          aria-labelledby='action-dialog-title'
          onClick={() => setModalAction(null)}
        >
          <div
            className='bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-200 shadow-xl space-y-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h3
                id='action-dialog-title'
                className='text-sm font-black text-[#1E293B]'
              >
                {modalAction.title}
              </h3>
              <button
                type='button'
                onClick={() => setModalAction(null)}
                className='p-1 rounded text-gray-400 hover:text-gray-700'
              >
                ✕
              </button>
            </div>
            <p className='text-xs text-gray-600'>{modalAction.subtitle}</p>
            <div className='p-2.5 rounded-xl bg-[#FAF8F5] border border-gray-200 text-[11px] text-gray-500'>
              Ready to submit or view records for {modalAction.title}.
            </div>
            <button
              type='button'
              onClick={() => setModalAction(null)}
              className='w-full py-2 bg-[#714B67] text-white text-xs font-bold rounded-xl hover:bg-[#5E3E56]'
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}