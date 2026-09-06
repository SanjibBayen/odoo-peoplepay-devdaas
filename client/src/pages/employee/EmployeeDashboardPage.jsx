import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import AttendanceCard from '../../components/dashboard/AttendanceCard.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import UpcomingCard from '../../components/dashboard/UpcomingCard.jsx';
import { attendanceApi } from '../../services/attendanceApi.js';
import { dashboardApi } from '../../services/dashboardApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    kpis: [],
    attendanceToday: null,
    upcoming: [],
    quickActions: [],
    todaySchedule: null,
    workedTime: null,
    workProgress: 0,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardRes = await dashboardApi.getEmployeeDashboard().catch(() => ({
        data: null,
      }));

      const data = dashboardRes?.data || null;

      // Build KPIs
      const kpis = data
        ? [
            {
              id: 1,
              label: 'Attendance Rate',
              value: `${data.metrics?.attendanceRate ?? 0}%`,
              badgeText: data.metrics?.presentDays > 0 ? '+ On Track' : 'No Records',
              hint: `${data.metrics?.presentDays ?? 0} of ${data.metrics?.totalDays ?? 0} days present`,
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
              hint: 'Total leave balance',
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
              hint: 'Time off requests pending',
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
              badgeText: data.today?.attendance?.isCurrentlyWorking ? 'Working' : data.today?.attendance ? 'Logged' : 'Pending',
              hint: data.today?.attendance?.checkIn
                ? `In: ${new Date(data.today.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Not checked in yet',
              iconType: 'user',
              bgColor: 'bg-purple-50',
              borderColor: 'border-purple-200',
              iconBg: 'bg-purple-100',
              valueColor: 'text-purple-700',
            },
          ]
        : [];

      // Build attendance card data from REAL backend
      const attendanceToday = data?.today?.attendance
        ? {
            checkIn: data.today.attendance.checkIn,
            checkOut: data.today.attendance.checkOut,
            status: data.today.attendance.status,
            workedMinutes: data.today.attendance.workedMinutes,
            workedTime: data.today.attendance.workedTime || `${Math.floor((data.today.attendance.workedMinutes || 0) / 60)}h ${String((data.today.attendance.workedMinutes || 0) % 60).padStart(2, '0')}m`,
            lateMinutes: data.today.attendance.lateMinutes || 0,
            overtimeMinutes: data.today.attendance.overtimeMinutes || 0,
            earlyExitMinutes: data.today.attendance.earlyExitMinutes || 0,
            breakMinutes: data.today.attendance.breakMinutes || 0,
            isCurrentlyWorking: data.today.attendance.isCurrentlyWorking || false,
          }
        : null;

      // Build today's schedule
      const todaySchedule = data?.today?.schedule
        ? {
            startTime: data.today.schedule.startTime,
            endTime: data.today.schedule.endTime,
            breakMinutes: data.today.schedule.breakMinutes,
            workingHours: data.today.schedule.workingHours,
            dayName: data.today.schedule.dayName,
            isWorkingDay: data.today.schedule.isWorkingDay,
            isWeekend: data.today.schedule.isWeekend,
          }
        : null;

      // Build upcoming leaves
      const upcomingLeaves = (data?.pendingRequests || [])
        .filter((r) => new Date(r.startDate) >= new Date())
        .slice(0, 3)
        .map((r) => ({
          id: r.id,
          title: r.type || 'Leave',
          subtitle: `${r.startDate} to ${r.endDate}`,
          status: r.status,
        }));

      // Quick actions with proper IDs and routes
      const quickActions = [
        {
          id: 'check-in',
          title: 'Check In / Out',
          subtitle: data?.today?.attendance?.checkIn ? 'Punch out for today' : 'Punch in for today',
          iconType: 'login',
          route: '/attendance',
        },
        {
          id: 'request-time-off',
          title: 'Request Time Off',
          subtitle: 'Submit a leave request',
          iconType: 'calendar',
          route: '/time-off',
        },
        {
          id: 'view-payslips',
          title: 'View Payslips',
          subtitle: 'Access your salary slips',
          iconType: 'document',
          route: '/payslips',
        },
      ];

      setDashboardData({
        kpis,
        attendanceToday,
        upcoming: upcomingLeaves,
        quickActions,
        todaySchedule,
        workedTime: data?.today?.attendance?.workedTime || null,
        workProgress: data?.today?.workProgress || 0,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError(extractErrorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle quick action navigation
  const handleQuickAction = (action) => {
    if (action.route) {
      navigate(action.route);
    }
  };

  // Handle check-in/check-out directly from dashboard
  const handleCheckIn = async () => {
    try {
      await attendanceApi.checkIn({});
      setStatusBanner({ type: 'success', text: 'Checked in successfully!' });
      setTimeout(() => setStatusBanner(null), 4000);
      await fetchDashboard();
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Check-in failed') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut({});
      setStatusBanner({ type: 'success', text: 'Checked out successfully!' });
      setTimeout(() => setStatusBanner(null), 4000);
      await fetchDashboard();
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Check-out failed') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const { kpis, attendanceToday, upcoming, quickActions, todaySchedule, workProgress } = dashboardData;

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
        <button type='button' onClick={fetchDashboard} className='ml-3 text-xs font-bold text-[#714B67] cursor-pointer'>
          Retry
        </button>
      </div>
    );
  }

  const firstName = user?.firstName || 'there';
  const hasCheckedIn = Boolean(attendanceToday?.checkIn);
  const hasCheckedOut = Boolean(attendanceToday?.checkOut);
  const isWorking = attendanceToday?.isCurrentlyWorking || false;

  return (
    <div className='space-y-5'>
      <PageHeader
        title={`Good morning, ${firstName}`}
        subtitle="Here's what's happening with your work today."
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            {todaySchedule?.isWorkingDay !== false ? '● Working Day' : '● Rest Day'}
          </span>
        }
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Attendance & Upcoming */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        <div className='lg:col-span-7'>
          <AttendanceCard
            attendance={attendanceToday}
            schedule={todaySchedule}
            workProgress={workProgress}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            hasCheckedIn={hasCheckedIn}
            hasCheckedOut={hasCheckedOut}
            isWorking={isWorking}
          />
        </div>
        <div className='lg:col-span-5'>
          <UpcomingCard items={upcoming} />
        </div>
      </div>

      {/* Quick Actions - Now navigates to real pages */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>Quick Actions</h3>
          <span className='text-[10px] text-gray-400'>Self-Service</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => handleQuickAction(action)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}