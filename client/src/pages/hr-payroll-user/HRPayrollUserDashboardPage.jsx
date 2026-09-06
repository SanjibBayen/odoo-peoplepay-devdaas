import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { DashboardSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import dashboardApi from '../../services/dashboardApi.js';
import payrunApi from '../../services/payrunApi.js';
import payslipApi from '../../services/payslipApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function HRPayrollUserDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, payrunRes, payslipRes] = await Promise.allSettled([
        dashboardApi.getKPIs(),
        payrunApi.getPayruns({ limit: 10 }),
        payslipApi.getPayslips({ limit: 10 }),
      ]);

      if (kpiRes.status === 'fulfilled') {
        const data = kpiRes.value?.data || {};
        setKpis([
          {
            id: 'total-net',
            label: 'Total Net Payroll',
            value: `₹${Math.round(data.totalNetSalary || 0).toLocaleString()}`,
            badgeText: 'Disbursed',
            hint: `${data.payslipCount || 0} payslips`,
            iconType: 'trending-up',
            bgColor: 'bg-emerald-50/50',
            borderColor: 'border-emerald-200/70',
            iconBg: 'bg-emerald-100/90 text-emerald-700',
            valueColor: 'text-emerald-950',
          },
          {
            id: 'payslips',
            label: 'Payslips Generated',
            value: String(data.payslipCount || 0),
            badgeText: 'Payroll',
            hint: 'Validated & paid',
            iconType: 'document',
            bgColor: 'bg-blue-50/50',
            borderColor: 'border-blue-200/70',
            iconBg: 'bg-blue-100/90 text-blue-700',
            valueColor: 'text-blue-950',
          },
          {
            id: 'pending',
            label: 'Pending Requests',
            value: String(data.pendingRequests || 0),
            badgeText: 'Awaiting',
            hint: 'Time off requests',
            iconType: 'clock',
            bgColor: 'bg-amber-50/50',
            borderColor: 'border-amber-200/70',
            iconBg: 'bg-amber-100/90 text-amber-800',
            valueColor: 'text-amber-950',
          },
          {
            id: 'attendance',
            label: 'Attendance Health',
            value: data.attendanceHealth || '0%',
            badgeText: 'Punches',
            hint: `${data.attendanceBreakdown?.present || 0} of ${data.attendanceBreakdown?.total || 0}`,
            iconType: 'users',
            bgColor: 'bg-purple-50/50',
            borderColor: 'border-purple-200/70',
            iconBg: 'bg-purple-100/90 text-[#714B67]',
            valueColor: 'text-purple-950',
          },
        ]);
      }

      if (payrunRes.status === 'fulfilled') {
        setPayruns(payrunRes.value?.data || []);
      }

      if (payslipRes.status === 'fulfilled') {
        setPayslips(payslipRes.value?.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payroll dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const quickActions = [
    { id: 'create-payrun', title: 'Create Payrun', subtitle: 'Start new payroll batch', iconType: 'plus' },
    { id: 'view-payruns', title: 'View Payruns', subtitle: 'All payroll batches', iconType: 'document' },
    { id: 'view-payslips', title: 'View Payslips', subtitle: 'Employee salary slips', iconType: 'file' },
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

  const fullName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Payroll Specialist';
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className='space-y-5'>
      <PageHeader
        title={`Welcome back, ${fullName}`}
        subtitle='HR Payroll User — Operational Dashboard'
        actions={
          <div className='flex items-center gap-2.5'>
            <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200'>
              📅 {todayDateStr}
            </span>
            <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] border border-purple-200'>
              Payroll User
            </span>
            <button
              type='button'
              onClick={() => navigate('/payruns/new')}
              className='px-3.5 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
            >
              <span>+</span>
              <span>Create Payrun</span>
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
        {/* Recent Payruns */}
        <div className='lg:col-span-7'>
          <DashboardSection title='Recent Payruns' subtitle='Latest payroll batches' action={
            <button type='button' onClick={() => navigate('/payruns')} className='text-[11px] font-bold text-[#714B67] hover:underline cursor-pointer'>
              View All ({payruns.length}) →
            </button>
          }>
            {payruns.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>No payruns yet.</p>
            ) : (
              <div className='space-y-2.5'>
                {payruns.slice(0, 5).map((pr) => (
                  <div key={pr.id} className='p-3 rounded-xl bg-[#FAF8F5] border flex items-center justify-between'>
                    <div>
                      <h4 className='text-xs font-bold'>{pr.name}</h4>
                      <p className='text-[11px] text-gray-500'>{pr.periodStart} - {pr.periodEnd}</p>
                    </div>
                    <StatusBadge status={pr.status} />
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>

        {/* Recent Payslips */}
        <div className='lg:col-span-5'>
          <DashboardSection title='Recent Payslips' subtitle='Latest generated slips' action={
            <button type='button' onClick={() => navigate('/payslips')} className='text-[11px] font-bold text-[#714B67] hover:underline cursor-pointer'>
              View All ({payslips.length}) →
            </button>
          }>
            {payslips.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>No payslips yet.</p>
            ) : (
              <div className='space-y-2.5 max-h-72 overflow-y-auto'>
                {payslips.slice(0, 5).map((ps) => (
                  <div key={ps.id} className='p-3 rounded-xl bg-[#FAF8F5] border flex items-center justify-between'>
                    <div>
                      <h4 className='text-xs font-bold'>{ps.payslipNumber}</h4>
                      <p className='text-[11px] text-gray-500'>₹{Number(ps.netSalary || 0).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={ps.status} />
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
              if (action.id === 'create-payrun') navigate('/payruns/new');
              else if (action.id === 'view-payruns') navigate('/payruns');
              else if (action.id === 'view-payslips') navigate('/payslips');
            }}
          />
        ))}
      </div>

      {/* Modal */}
      {modalMessage && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' onClick={() => setModalMessage(null)}>
          <div className='bg-white rounded-2xl p-5 max-w-sm w-full border shadow-xl space-y-4' onClick={(e) => e.stopPropagation()}>
            <h3 className='text-sm font-black'>Notice</h3>
            <p className='text-xs text-gray-600'>{modalMessage}</p>
            <button type='button' onClick={() => setModalMessage(null)} className='w-full py-2 bg-[#714B67] text-white text-xs font-bold rounded-xl cursor-pointer'>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}