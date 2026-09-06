import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import dashboardApi from '../../services/dashboardApi.js';
import timeOffApi from '../../services/timeOffApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function HRManagerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, deptRes, timeOffRes] = await Promise.allSettled([
        dashboardApi.getKPIs(),
        dashboardApi.getSalaryByDepartment(),
        timeOffApi.getRequests({ status: 'PENDING' }),
      ]);

      // KPIs
      if (kpiRes.status === 'fulfilled') {
        const data = kpiRes.value?.data || {};
        setKpis([
          {
            id: 'total-employees',
            label: 'Total Workforce',
            value: String(data.totalEmployees || 0),
            badgeText: 'Active Staff',
            hint: 'Across all departments',
            iconType: 'users',
            bgColor: 'bg-blue-50/50',
            borderColor: 'border-blue-200/70',
            iconBg: 'bg-blue-100/90 text-blue-700',
            valueColor: 'text-blue-950',
          },
          {
            id: 'attendance-health',
            label: 'Attendance Health',
            value: data.attendanceHealth || '0%',
            badgeText: 'Punches',
            hint: `${data.attendanceBreakdown?.present || 0} present of ${data.attendanceBreakdown?.total || 0}`,
            iconType: 'clock',
            bgColor: 'bg-purple-50/50',
            borderColor: 'border-purple-200/70',
            iconBg: 'bg-purple-100/90 text-[#714B67]',
            valueColor: 'text-purple-950',
          },
          {
            id: 'time-off-approved',
            label: 'Time Off Approved',
            value: `${data.approvedTimeOffDays || 0} Days`,
            badgeText: 'Leave',
            hint: `${data.pendingRequests || 0} pending review`,
            iconType: 'calendar',
            bgColor: 'bg-amber-50/50',
            borderColor: 'border-amber-200/70',
            iconBg: 'bg-amber-100/90 text-amber-800',
            valueColor: 'text-amber-950',
          },
          {
            id: 'payslips',
            label: 'Payslips Generated',
            value: String(data.payslipCount || 0),
            badgeText: 'Payroll',
            hint: `${data.totalNetSalary ? `₹${Math.round(data.totalNetSalary).toLocaleString()}` : '₹0'} net salary`,
            iconType: 'document',
            bgColor: 'bg-emerald-50/50',
            borderColor: 'border-emerald-200/70',
            iconBg: 'bg-emerald-100/90 text-emerald-700',
            valueColor: 'text-emerald-950',
          },
        ]);
      }

      // Department data
      if (deptRes.status === 'fulfilled') {
        setDepartmentData(deptRes.value?.data || []);
      }

      // Pending leaves
      if (timeOffRes.status === 'fulfilled') {
        const list = timeOffRes.value?.data || [];
        setPendingLeaves(
          list.map((l) => ({
            id: l.id,
            employeeName: l.employee?.firstName
              ? `${l.employee.firstName} ${l.employee.lastName || ''}`.trim()
              : l.employeeName || 'Employee',
            leaveType: l.timeOffType?.name || 'Time Off',
            duration: `${l.duration || 0} days`,
            dates: `${l.startDate} - ${l.endDate}`,
            avatar: l.employee?.firstName?.charAt(0) || 'E',
          }))
        );
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleApprove = async (id, name) => {
    try {
      await timeOffApi.approveRequest(id);
      setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
      setModalMessage(`Leave request for ${name} has been approved.`);
    } catch (err) {
      setModalMessage(extractErrorMessage(err, 'Failed to approve request'));
    }
  };

  const handleReject = async (id, name) => {
    try {
      await timeOffApi.refuseRequest(id, { refusalReason: 'Operational scheduling' });
      setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
      setModalMessage(`Leave request for ${name} was rejected.`);
    } catch (err) {
      setModalMessage(extractErrorMessage(err, 'Failed to reject request'));
    }
  };

  const quickActions = [
    { id: 'add-employee', title: 'Add Employee', subtitle: 'Onboard new team member', iconType: 'user-plus' },
    { id: 'view-attendance', title: 'View Attendance', subtitle: 'Check daily punches', iconType: 'clock' },
    { id: 'manage-leaves', title: 'Manage Leaves', subtitle: 'Review requests', iconType: 'calendar' },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className='py-6'>
        <ErrorState
          title='Dashboard Unavailable'
          message={error}
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'HR Manager';
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className='space-y-5'>
      <PageHeader
        title={`Welcome back, ${fullName}`}
        subtitle='HR Manager — Operational Dashboard'
        actions={
          <div className='flex items-center gap-2.5'>
            <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200'>
              📅 {todayDateStr}
            </span>
            <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200'>
              HR Manager
            </span>
            <button
              type='button'
              onClick={() => navigate('/employees/add')}
              className='px-3.5 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
            >
              <span>+</span>
              <span>Add Employee</span>
            </button>
          </div>
        }
      />

      {/* KPIs */}
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

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Department Overview */}
        <div className='lg:col-span-5'>
          <DashboardSection title='Department Overview' subtitle='Headcount distribution' action={
            <span className='text-[10px] text-gray-400'>{departmentData.length} Departments</span>
          }>
            {departmentData.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>No department data available.</p>
            ) : (
              <div className='space-y-3'>
                {departmentData.map((dept) => (
                  <div key={dept.departmentId} className='flex items-center justify-between text-xs'>
                    <span className='font-bold'>{dept.departmentName}</span>
                    <span className='text-gray-500'>{dept.headcount} members</span>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        {/* Pending Time Off */}
        <div className='lg:col-span-7'>
          <DashboardSection title='Pending Time Off' subtitle='Requires manager authorization' action={
            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200'>
              {pendingLeaves.length} Pending
            </span>
          }>
            {pendingLeaves.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>All leave requests processed!</p>
            ) : (
              <div className='space-y-2.5'>
                {pendingLeaves.map((req) => (
                  <div key={req.id} className='p-3 rounded-xl bg-[#FAF8F5] border flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='flex items-center gap-2.5'>
                      <div className='w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center'>
                        {req.avatar}
                      </div>
                      <div>
                        <h4 className='text-xs font-bold'>{req.employeeName}</h4>
                        <p className='text-[11px] text-gray-500'>{req.leaveType} • {req.duration}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button type='button' onClick={() => handleReject(req.id, req.employeeName)} className='px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-rose-600 border rounded-lg cursor-pointer'>
                        Reject
                      </button>
                      <button type='button' onClick={() => handleApprove(req.id, req.employeeName)} className='px-3 py-1 text-[11px] font-bold text-white bg-[#714B67] rounded-lg cursor-pointer'>
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.id}
            action={action}
            onClick={() => {
              if (action.id === 'add-employee') navigate('/employees/add');
              else if (action.id === 'view-attendance') navigate('/attendance');
              else if (action.id === 'manage-leaves') navigate('/time-off/requests');
            }}
          />
        ))}
      </div>

      {/* Modal */}
      {modalMessage && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' onClick={() => setModalMessage(null)}>
          <div className='bg-white rounded-2xl p-5 max-w-sm w-full border shadow-xl space-y-4' onClick={(e) => e.stopPropagation()}>
            <h3 className='text-sm font-black'>Action Notice</h3>
            <p className='text-xs text-gray-600'>{modalMessage}</p>
            <button type='button' onClick={() => setModalMessage(null)} className='w-full py-2 bg-[#714B67] text-white text-xs font-bold rounded-xl cursor-pointer'>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}