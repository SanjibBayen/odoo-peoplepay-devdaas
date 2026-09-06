import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import PayrollStatusCard from '../../components/dashboard/PayrollStatusCard.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import dashboardApi from '../../services/dashboardApi.js';
import payrunApi from '../../services/payrunApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function HRPayrollManagerDashboardPage() {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, payrunRes, alertsRes] = await Promise.allSettled([
        dashboardApi.getKPIs(),
        payrunApi.getPayruns({ limit: 10 }),
        dashboardApi.getAlerts(),
      ]);

      if (kpiRes.status === 'fulfilled') {
        const data = kpiRes.value?.data || {};
        setKpis([
          {
            id: 'total-net',
            label: 'Total Net Payroll',
            value: `₹${Math.round(data.totalNetSalary || 0).toLocaleString()}`,
            badgeText: 'Disbursed',
            hint: `${data.payslipCount || 0} payslips processed`,
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
            id: 'avg-salary',
            label: 'Average Salary',
            value: `₹${Math.round(data.averageSalary || 0).toLocaleString()}`,
            badgeText: 'Per Employee',
            hint: `${data.totalEmployees || 0} employees`,
            iconType: 'users',
            bgColor: 'bg-purple-50/50',
            borderColor: 'border-purple-200/70',
            iconBg: 'bg-purple-100/90 text-[#714B67]',
            valueColor: 'text-purple-950',
          },
          {
            id: 'pending-requests',
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
        ]);
      }

      if (payrunRes.status === 'fulfilled') {
        const list = payrunRes.value?.data || [];
        setPayruns(Array.isArray(list) ? list : []);
      }

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value?.data || []);
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
    { id: 'salary-structures', title: 'Salary Structures', subtitle: 'Configure rules', iconType: 'settings' },
  ];

  if (loading) {
    return (
      <div className='py-12'>
        <div className='text-gray-400 text-sm text-center'>Loading payroll dashboard...</div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Payroll Manager Dashboard'
        subtitle='Executive sign-offs, statutory audit validation, and fund disbursals.'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            Payroll Manager
          </span>
        }
      />

      {error && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs'>
          {error}
          <button type='button' onClick={loadDashboard} className='ml-2 font-bold cursor-pointer'>Retry</button>
        </div>
      )}

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
        {/* Payrun Status */}
        <div className='lg:col-span-5'>
          <DashboardSection title='Recent Payruns' subtitle='Latest payroll batches' action={
            <span className='text-[10px] text-gray-400'>{payruns.length} Batches</span>
          }>
            {payruns.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>No payruns found.</p>
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

        {/* Operational Alerts */}
        <div className='lg:col-span-7'>
          <DashboardSection title='Compliance Alerts' subtitle='Payroll warnings and exceptions' action={
            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200'>
              {alerts.length} Alerts
            </span>
          }>
            {alerts.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>No alerts. All systems compliant.</p>
            ) : (
              <div className='space-y-2.5 max-h-72 overflow-y-auto'>
                {alerts.map((alert, idx) => (
                  <div key={idx} className='p-3 rounded-xl bg-[#FAF8F5] border flex items-start gap-2'>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      alert.severity === 'ERROR' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {alert.severity || 'WARNING'}
                    </span>
                    <div>
                      <p className='text-xs font-semibold'>{alert.message}</p>
                      {alert.employeeName && <p className='text-[11px] text-gray-500'>Employee: {alert.employeeName}</p>}
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
              if (action.id === 'create-payrun') navigate('/payroll/payruns/new');
              else if (action.id === 'view-payruns') navigate('/payroll/payruns');
              else if (action.id === 'salary-structures') navigate('/salary/structures');
            }}
          />
        ))}
      </div>

      {/* Modal */}
      {modalMessage && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' onClick={() => setModalMessage(null)}>
          <div className='bg-white rounded-2xl p-5 max-w-sm w-full border shadow-xl space-y-4' onClick={(e) => e.stopPropagation()}>
            <h3 className='text-sm font-black'>Payroll Notice</h3>
            <p className='text-xs text-gray-600'>{modalMessage}</p>
            <button type='button' onClick={() => setModalMessage(null)} className='w-full py-2 bg-[#714B67] text-white text-xs font-bold rounded-xl cursor-pointer'>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}