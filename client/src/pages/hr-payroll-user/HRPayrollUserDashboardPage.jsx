import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { HR_PAYROLL_USER_DATA } from '../../data/hrPayrollUserDashboardData.js';

/**
 * HR Payroll User Dashboard for PeoplePay.
 * 4 KPIs • 2 Main Content Cards • 3 Quick Actions
 */
export default function HRPayrollUserDashboardPage() {
  const { kpis, batchPipeline, quickActions } = HR_PAYROLL_USER_DATA;

  const [modalMessage, setModalMessage] = useState(null);

  return (
    <div className='space-y-5'>
      {/* Compact Page Header */}
      <PageHeader
        title='Payroll Operations'
        subtitle='Batch wage computations, statutory rule calculations, and attendance matching.'
        handwrittenNote='Stay on track →'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-[#714B67] border border-purple-200'>
            Current Cutoff: Sep 25
          </span>
        }
      />

      {/* 4 KPIs */}
      <section aria-labelledby='payroll-kpi-heading'>
        <h2 id='payroll-kpi-heading' className='sr-only'>
          Payroll Indicators
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

      {/* 2 Main Content Cards: Payroll Preparation & Attendance Reconciliation */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Card 1: Payroll Preparation */}
        <div className='lg:col-span-7'>
          <DashboardSection
            title='Payroll Preparation'
            subtitle='Batch #2026-09 computation stages'
            action={<StatusBadge status='In Progress' />}
          >
            <div className='space-y-3'>
              {batchPipeline.map((stage) => (
                <div key={stage.name} className='space-y-1'>
                  <div className='flex items-center justify-between text-xs font-bold'>
                    <span className='text-[#1E293B]'>{stage.name}</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-400 text-[10px] font-medium'>
                        {stage.detail}
                      </span>
                      <StatusBadge status={stage.status} />
                    </div>
                  </div>
                  <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-[#714B67]'
                      style={{ width: `${stage.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>

        {/* Card 2: Attendance Reconciliation */}
        <div className='lg:col-span-5'>
          <DashboardSection
            title='Attendance Reconciliation'
            subtitle='Biometric punch logs vs roster'
            action={<StatusBadge status='97.5% Matched' />}
          >
            <div className='space-y-3 text-xs'>
              <div className='flex justify-between py-1.5 border-b border-gray-100'>
                <span className='text-gray-500'>Total Roster Headcount</span>
                <span className='font-bold text-[#1E293B]'>248 Staff</span>
              </div>
              <div className='flex justify-between py-1.5 border-b border-gray-100'>
                <span className='text-gray-500'>Verified Check-Ins</span>
                <span className='font-bold text-emerald-700'>242 Staff</span>
              </div>
              <div className='flex justify-between py-1.5 border-b border-gray-100'>
                <span className='text-gray-500'>Missing Punches</span>
                <span className='font-bold text-amber-700'>6 Cases</span>
              </div>
              <p className='text-[11px] text-gray-400 pt-1'>
                Timesheets will lock automatically at 11:59 PM on cutoff date.
              </p>
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
          <span className='text-[10px] text-gray-400'>Payroll Ops</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() =>
                setModalMessage(`Executing ${action.title}...`)
              }
            />
          ))}
        </div>
      </div>

      {/* Action Toast/Modal */}
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
                Discrepancy Status
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
