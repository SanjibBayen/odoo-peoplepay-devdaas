import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import ActivityList from '../../components/dashboard/ActivityList.jsx';
import DashboardSection from '../../components/dashboard/DashboardSection.jsx';
import QuickActionCard from '../../components/dashboard/QuickActionCard.jsx';
import { ADMIN_DATA } from '../../data/adminDashboardData.js';

/**
 * Admin Dashboard for PeoplePay.
 * 4 KPIs • 2 Main Content Cards • 3 Quick Actions
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { kpis, roleDistribution, auditEvents, quickActions } = ADMIN_DATA;

  const [modalMessage, setModalMessage] = useState(null);

  return (
    <div className='space-y-5'>
      {/* Compact Page Header */}
      <PageHeader
        title='System Administration'
        subtitle='Platform governance, security controls, multi-role RBAC, and audit logs.'
        handwrittenNote='Total security & control'
        actions={
          <span className='text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200'>
            ● ISO 27001 Certified
          </span>
        }
      />

      {/* 4 KPIs */}
      <section aria-labelledby='admin-kpi-heading'>
        <h2 id='admin-kpi-heading' className='sr-only'>
          System Indicators
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

      {/* 2 Main Content Cards: Organization Overview (RBAC) & Recent System Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Card 1: Organization Overview (RBAC Role Distribution) */}
        <div className='lg:col-span-6'>
          <DashboardSection
            title='Organization Overview'
            subtitle='Role-Based Access Control (RBAC) user distribution'
            action={
              <span className='text-[10px] text-gray-400 font-medium'>
                312 Total Accounts
              </span>
            }
          >
            <div className='divide-y divide-gray-100'>
              {roleDistribution.map((r) => (
                <div
                  key={r.role}
                  className='py-2.5 flex items-center justify-between'
                >
                  <div className='flex items-center gap-2'>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${r.badge}`}
                    >
                      {r.role}
                    </span>
                    <span className='text-xs font-semibold text-gray-700'>
                      Permitted Workspace
                    </span>
                  </div>
                  <span className='text-xs font-black text-[#1E293B]'>
                    {r.count} users
                  </span>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>

        {/* Card 2: Recent System Activity (Security Audit Events) */}
        <div className='lg:col-span-6'>
          <ActivityList
            activities={auditEvents.map((a) => ({
              id: a.id,
              category: a.status,
              title: a.action,
              timestamp: a.time,
              description: `${a.user} (${a.ip}) — ${a.detail}`,
              badgeStyle:
                a.status === 'Success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200',
              iconType: 'shield',
            }))}
            title='Recent System Activity'
            badge='Audit Log'
          />
        </div>
      </div>

      {/* 3 Quick Actions */}
      <div className='space-y-2.5'>
        <div className='flex items-center justify-between px-1'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-gray-400'>
            Quick Actions
          </h3>
          <span className='text-[10px] text-gray-400'>System Controls</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {quickActions.slice(0, 3).map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => {
                if (action.id === 'manage-users') {
                  navigate('/employees');
                } else {
                  setModalMessage(`Opening ${action.title}...`);
                }
              }}
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
                Admin Notice
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
