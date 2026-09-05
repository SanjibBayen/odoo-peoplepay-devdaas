import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { HR_MANAGER_DATA } from '../../data/hrManagerDashboardData.js';

/**
 * HR Manager Dashboard for PeoplePay.
 * 4 KPIs • 2 Main Content Cards • 3 Quick Actions
 */
export default function HRManagerDashboardPage() {
  const { kpis, departments, pendingLeaves, quickActions } = HR_MANAGER_DATA;

  const [leavesList, setLeavesList] = useState(pendingLeaves);
  const [modalMessage, setModalMessage] = useState(null);

  const handleApprove = (id, name) => {
    setLeavesList((prev) => prev.filter((l) => l.id !== id));
    setModalMessage(`Leave request for ${name} has been approved.`);
  };

  const handleReject = (id, name) => {
    setLeavesList((prev) => prev.filter((l) => l.id !== id));
    setModalMessage(`Leave request for ${name} was rejected.`);
  };

  return (
    <div className='space-y-5'>
      {/* Compact Page Header */}
      <PageHeader
        title='HR Manager Dashboard'
        subtitle='Workforce health, department staffing, and approval queues.'
        handwrittenNote='People first. 🚀'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200'>
            248 Total Headcount
          </span>
        }
      />

      {/* 4 KPIs */}
      <section aria-labelledby='hr-kpi-heading'>
        <h2 id='hr-kpi-heading' className='sr-only'>
          HR Metrics
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

      {/* 2 Main Content Cards: Workforce Overview & Pending Time Off */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Card 1: Workforce Overview (Department Distribution) */}
        <div className='lg:col-span-5'>
          <DashboardSection
            title='Workforce Overview'
            subtitle='Department headcount distribution'
            action={
              <span className='text-[10px] text-gray-400 font-medium'>
                5 Departments
              </span>
            }
          >
            <div className='space-y-3'>
              {departments.map((dept) => (
                <div key={dept.name} className='space-y-1'>
                  <div className='flex items-center justify-between text-xs font-bold'>
                    <span className='text-[#1E293B]'>{dept.name}</span>
                    <span className='text-gray-500 font-medium'>
                      {dept.count} members ({dept.percentage}%)
                    </span>
                  </div>
                  <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${dept.color}`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>

        {/* Card 2: Pending Time Off */}
        <div className='lg:col-span-7'>
          <DashboardSection
            title='Pending Time Off'
            subtitle='Requires manager authorization'
            action={
              <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200'>
                {leavesList.length} Pending
              </span>
            }
          >
            {leavesList.length === 0 ? (
              <p className='text-xs text-gray-400 py-4 text-center'>
                All leave requests processed! No pending items.
              </p>
            ) : (
              <div className='space-y-2.5'>
                {leavesList.map((req) => (
                  <div
                    key={req.id}
                    className='p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                  >
                    <div className='flex items-center gap-2.5'>
                      <div className='w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0'>
                        {req.avatar}
                      </div>
                      <div>
                        <div className='flex items-center gap-1.5'>
                          <h4 className='text-xs font-bold text-[#1E293B]'>
                            {req.employeeName}
                          </h4>
                          <span className='text-[9px] text-gray-400'>
                            ({req.department})
                          </span>
                        </div>
                        <p className='text-[11px] text-gray-500'>
                          {req.leaveType} • {req.duration}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
                      <button
                        type='button'
                        onClick={() => handleReject(req.id, req.employeeName)}
                        className='px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-gray-200 rounded-lg transition-colors cursor-pointer'
                      >
                        Reject
                      </button>
                      <button
                        type='button'
                        onClick={() => handleApprove(req.id, req.employeeName)}
                        className='px-3 py-1 text-[11px] font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-lg transition-colors cursor-pointer'
                      >
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

      {/* 3 Quick Actions */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Quick Actions
          </h3>
          <span className='text-[10px] text-gray-400'>HR Shortcuts</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() =>
                setModalMessage(`Opening ${action.title} modal...`)
              }
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
                Action Notice
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
