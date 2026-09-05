import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import PayrollStatusCard from '../../components/dashboard/PayrollStatusCard.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { HR_PAYROLL_MANAGER_DATA } from '../../data/hrPayrollManagerDashboardData.js';

/**
 * HR Payroll Manager Dashboard for PeoplePay.
 * 4 KPIs • 2 Main Content Cards • 3 Quick Actions
 */
export default function HRPayrollManagerDashboardPage() {
  const {
    kpis,
    payrunStatus,
    approvalQueue,
    quickActions,
  } = HR_PAYROLL_MANAGER_DATA;

  const [queue, setQueue] = useState(approvalQueue);
  const [modalMessage, setModalMessage] = useState(null);

  const handleApproveBatch = (id, department) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'Validated' } : item
      )
    );
    setModalMessage(`Authorized payroll allocation for ${department}.`);
  };

  return (
    <div className='space-y-5'>
      {/* Compact Page Header */}
      <PageHeader
        title='Payroll Manager Dashboard'
        subtitle='Executive sign-offs, statutory audit validation, and fund disbursals.'
        handwrittenNote='Audit-ready and verified'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            ● Disbursal Scheduled: Sep 30
          </span>
        }
      />

      {/* 4 KPIs */}
      <section aria-labelledby='prm-kpi-heading'>
        <h2 id='prm-kpi-heading' className='sr-only'>
          Executive Payroll Metrics
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

      {/* 2 Main Content Cards: Current Payrun & Approval Queue */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Card 1: Current Payrun Status */}
        <div className='lg:col-span-5'>
          <PayrollStatusCard
            payrun={payrunStatus}
            onAction={() =>
              setModalMessage(
                'September 2026 payrun batch pre-authorized for bank disbursal.'
              )
            }
          />
        </div>

        {/* Card 2: Payroll Approval Queue */}
        <div className='lg:col-span-7'>
          <DashboardSection
            title='Approval Queue'
            subtitle='Batches pending executive authorization'
            action={
              <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200'>
                {queue.filter((q) => q.status !== 'Validated').length} Pending
              </span>
            }
          >
            <div className='space-y-2.5'>
              {queue.map((item) => (
                <div
                  key={item.id}
                  className='p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                >
                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='text-xs font-bold text-[#1E293B]'>
                        {item.department}
                      </h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className='text-[11px] text-gray-500 mt-0.5'>
                      Headcount: {item.headcount} • Total:{' '}
                      <strong className='text-[#714B67]'>{item.amount}</strong>{' '}
                      • Prep: {item.submittedBy}
                    </p>
                  </div>

                  <div className='self-end sm:self-auto shrink-0'>
                    {item.status === 'Validated' ? (
                      <span className='text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200'>
                        ✓ Authorized
                      </span>
                    ) : (
                      <button
                        type='button'
                        onClick={() =>
                          handleApproveBatch(item.id, item.department)
                        }
                        className='px-3 py-1 text-[11px] font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-lg transition-colors cursor-pointer'
                      >
                        Authorize
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>

      {/* 3 Quick Actions */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Quick Actions
          </h3>
          <span className='text-[10px] text-gray-400'>Governance</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => setModalMessage(`Opening ${action.title}...`)}
            />
          ))}
        </div>
      </div>

      {/* Confirmation Toast/Modal */}
      {modalMessage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
          onClick={() => setModalMessage(null)}
        >
          <div
            className='bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-200 shadow-xl space-y-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                Payroll Notice
              </h3>
              <button
                type='button'
                onClick={() => setModalMessage(null)}
                className='p-1 rounded text-gray-400 hover:text-gray-700'
              >
                ✕
              </button>
            </div>
            <p className='text-xs text-gray-600'>{modalMessage}</p>
            <button
              type='button'
              onClick={() => setModalMessage(null)}
              className='w-full py-2 bg-[#714B67] text-white text-xs font-bold rounded-xl'
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
