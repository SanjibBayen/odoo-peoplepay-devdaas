import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal.jsx';
import apiClient from '../../services/apiClient.js';
import useLogout from '../../hooks/useLogout.js';
import { selectCurrentUser, selectCurrentRole } from '../../redux/selectors/authSelectors.js';

export default function SettingsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const currentRole = useSelector(selectCurrentRole);
  const logout = useLogout();

  const [activeTab, setActiveTab] = useState('account');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // System Health State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await apiClient.get('/health');
      setHealthData(res.data || res);
    } catch (err) {
      setHealthError(err.response?.data?.message || err.message || 'Unable to connect to backend health endpoint.');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  const tabs = [
    { id: 'account', label: 'Account & Security' },
    { id: 'system', label: 'System & Health' },
  ];

  return (
    <div className='space-y-6 max-w-5xl'>
      <PageHeader
        title='System Settings'
        subtitle='Account security, authentication policies, and live infrastructure health.'
      />

      {/* Tabs Navigation */}
      <div className='flex items-center gap-1.5 border-b border-[#EAE6DF] pb-px overflow-x-auto'>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type='button'
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[#714B67] border-t border-l border-r border-[#EAE6DF] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-[#FAF8F5]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className='space-y-5'>
        {/* TAB 1: Account & Security */}
        {activeTab === 'account' && (
          <div className='space-y-4'>
            {/* Account Card */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4'>
              <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <div>
                  <h3 className='text-sm font-bold text-[#1E293B]'>Personal Account</h3>
                  <p className='text-xs text-gray-500'>Active administrative identity and authentication status.</p>
                </div>
                <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                  Active Session
                </span>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'>
                <div>
                  <label className='block font-semibold text-gray-500 mb-1'>Signed in as</label>
                  <div className='font-bold text-gray-900'>{currentUser?.fullName || currentUser?.firstName || 'System Administrator'}</div>
                </div>
                <div>
                  <label className='block font-semibold text-gray-500 mb-1'>Email Address</label>
                  <div className='font-mono text-gray-800'>{currentUser?.email || 'admin@peoplepay.internal'}</div>
                </div>
                <div>
                  <label className='block font-semibold text-gray-500 mb-1'>Active Role</label>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200'>
                    {(currentRole || 'ADMIN').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className='block font-semibold text-gray-500 mb-1'>Authentication Mode</label>
                  <span className='text-gray-700 font-medium'>JWT + Redis Session + OTP 2FA</span>
                </div>
              </div>

              <div className='pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5'>
                <button
                  type='button'
                  onClick={() => setIsPasswordModalOpen(true)}
                  className='px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] transition-colors cursor-pointer'
                >
                  Change Account Password
                </button>
                <button
                  type='button'
                  onClick={logout}
                  className='px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer'
                >
                  Log Out Everywhere
                </button>
              </div>
            </div>

            {/* Security Policy Card */}
            <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-3.5'>
              <h3 className='text-sm font-bold text-[#1E293B] border-b border-gray-100 pb-2.5'>
                System Security & MFA Policies
              </h3>
              <div className='space-y-2.5 text-xs'>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Two-Factor Authentication (OTP)</div>
                    <div className='text-[11px] text-gray-500'>Mandatory 6-digit OTP dispatched via Redis & Email on every login.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>Enforced</span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Password Complexity Policy</div>
                    <div className='text-[11px] text-gray-500'>Minimum 8 characters with uppercase, lowercase, numbers, and symbols.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>Enforced</span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Token Lifetime & Rotation</div>
                    <div className='text-[11px] text-gray-500'>15-min JWT access token with secure HTTP-only refresh cookie rotation.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>Active</span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Magic Link Onboarding</div>
                    <div className='text-[11px] text-gray-500'>New employees receive secure 24-hour magic links for password setup.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>Enforced</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: System & Health */}
        {activeTab === 'system' && (
          <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-bold text-[#1E293B]'>Live Infrastructure & API Health</h3>
                <p className='text-xs text-gray-500'>Direct diagnostics from backend endpoint <code className='font-mono font-bold'>GET /api/health</code>.</p>
              </div>
              <button
                type='button'
                onClick={fetchSystemHealth}
                disabled={healthLoading}
                className='px-3 py-1.5 rounded-lg text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer transition-colors disabled:opacity-50'
              >
                {healthLoading ? 'Checking...' : 'Refresh Diagnostics'}
              </button>
            </div>

            {healthLoading ? (
              <div className='py-6 text-center text-gray-500'>Pinging backend health endpoint...</div>
            ) : healthError ? (
              <div className='p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1'>
                <div className='font-bold'>Backend Connection Status: Offline</div>
                <div className='text-[11px] text-rose-600'>{healthError}</div>
              </div>
            ) : healthData ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-emerald-700'>API Server</div>
                  <div className='text-base font-black text-emerald-900 capitalize'>{healthData.status || 'healthy'}</div>
                </div>
                <div className='p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-blue-700'>Database Connection</div>
                  <div className='text-base font-black text-blue-900 capitalize'>{healthData.database || 'connected'}</div>
                </div>
                <div className='p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-gray-500'>Server Timestamp</div>
                  <div className='text-xs font-mono font-bold text-gray-800 truncate'>
                    {healthData.timestamp ? new Date(healthData.timestamp).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-gray-400'>Click Refresh Diagnostics to test server connectivity.</div>
            )}

            <div className='pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2'>
              <span>Application: <strong>PeoplePay HR & Payroll</strong></span>
              <span>Environment: <strong>{process.env.NODE_ENV || 'development'}</strong></span>
            </div>
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}