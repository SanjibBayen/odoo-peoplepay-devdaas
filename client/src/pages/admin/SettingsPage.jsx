import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal.jsx';
import apiClient from '../../services/apiClient.js';
import useLogout from '../../hooks/useLogout.js';
import { selectCurrentUser, selectCurrentRole } from '../../redux/selectors/authSelectors.js';
import { INITIAL_SETTINGS } from '../../data/adminData.js';

export default function SettingsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const currentRole = useSelector(selectCurrentRole);
  const logout = useLogout();

  const [activeTab, setActiveTab] = useState('account');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  // Live System Health State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await apiClient.get('/health');
      setHealthData(res.data);
    } catch (err) {
      setHealthError(err.message || 'Unable to connect to backend health endpoint.');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/health')
      .then((res) => {
        if (isMounted) {
          setHealthData(res.data);
          setHealthError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHealthError(err.message || 'Unable to connect to backend health endpoint.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setHealthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = [
    { id: 'account', label: 'Account & Security' },
    { id: 'organization', label: 'Organization' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'system', label: 'System & Health' },
  ];

  return (
    <div className='space-y-6 max-w-5xl'>
      <PageHeader
        title='System Settings'
        subtitle='Organization profile, payroll fiscal rules, security policies, and live infrastructure health.'
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
                  <div className='font-bold text-gray-900'>{currentUser?.fullName || 'System Administrator'}</div>
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
                  <span className='text-gray-700 font-medium'>JWT + Redis Session + HTTP-Only Cookie</span>
                </div>
              </div>

              <div className='pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5'>
                <button
                  type='button'
                  onClick={() => setIsPasswordModalOpen(true)}
                  className='px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] transition-colors cursor-pointer shadow-2xs'
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
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                    Enforced
                  </span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Password Complexity Policy</div>
                    <div className='text-[11px] text-gray-500'>Minimum 8 characters with mixed uppercase, lowercase, numbers, and symbols.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                    Enforced
                  </span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70'>
                  <div>
                    <div className='font-bold text-gray-900'>Token Lifetime & Rotation</div>
                    <div className='text-[11px] text-gray-500'>15-min JWT access token renewal with secure HTTP-only refresh cookie rotation.</div>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Organization Profile */}
        {activeTab === 'organization' && (
          <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-bold text-[#1E293B]'>Organization Profile</h3>
                <p className='text-xs text-gray-500'>Company identity, tax identifiers, and registered office.</p>
              </div>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                Configuration Ready (Backend API Pending)
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Legal Business Name</label>
                <input
                  type='text'
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Tax Registration Number (GSTIN/EIN)</label>
                <input
                  type='text'
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
              <div className='sm:col-span-2'>
                <label className='block font-semibold text-gray-700 mb-1'>Registered Corporate Address</label>
                <input
                  type='text'
                  defaultValue='Tower B, 7th Floor, Embassy TechVillage, Outer Ring Rd, Bengaluru, Karnataka 560103'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
            </div>

            <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600'>
              Note: Updating organization profile values requires backend endpoint <code className='font-mono'>PUT /api/organization</code> which is pending development.
            </div>
          </div>
        )}

        {/* TAB 3: Payroll Disbursal Configuration */}
        {activeTab === 'payroll' && (
          <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-bold text-[#1E293B]'>Payroll & Fiscal Disbursal</h3>
                <p className='text-xs text-gray-500'>Default currency, monthly cutoff schedule, and statutory fiscal cycles.</p>
              </div>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                Configuration Ready (Backend API Pending)
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Primary Currency</label>
                <input
                  type='text'
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Monthly Cutoff Day</label>
                <input
                  type='number'
                  min='1'
                  max='31'
                  value={settings.payrunCutoffDay}
                  onChange={(e) => setSettings({ ...settings, payrunCutoffDay: Number(e.target.value) })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Standard Working Days</label>
                <input
                  type='number'
                  min='1'
                  max='31'
                  value={settings.workingDaysPerMonth}
                  onChange={(e) => setSettings({ ...settings, workingDaysPerMonth: Number(e.target.value) })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
            </div>

            <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600'>
              Note: Fiscal parameters will sync with the automated payrun engine once backend fiscal service is deployed.
            </div>
          </div>
        )}

        {/* TAB 4: Attendance & Scheduling */}
        {activeTab === 'attendance' && (
          <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-bold text-[#1E293B]'>Attendance & Work Schedule Policies</h3>
                <p className='text-xs text-gray-500'>Working hours, biometric tolerances, and grace period settings.</p>
              </div>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                Configuration Ready (Backend API Pending)
              </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Check-in Grace Period (Minutes)</label>
                <input
                  type='number'
                  defaultValue='15'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Standard Shift Length (Hours)</label>
                <input
                  type='number'
                  defaultValue='8'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Notifications */}
        {activeTab === 'notifications' && (
          <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 text-xs'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-bold text-[#1E293B]'>Notification Preferences</h3>
                <p className='text-xs text-gray-500'>Automated email triggers and portal alert routing.</p>
              </div>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200'>
                Configuration Ready (Backend API Pending)
              </span>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 cursor-pointer'>
                <input type='checkbox' defaultChecked className='rounded text-[#714B67]' />
                <div>
                  <div className='font-bold text-gray-900'>Payslip Disbursal Notifications</div>
                  <div className='text-[11px] text-gray-500'>Automatically email employees itemized salary receipts upon payrun sign-off.</div>
                </div>
              </label>

              <label className='flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-gray-200 cursor-pointer'>
                <input type='checkbox' defaultChecked className='rounded text-[#714B67]' />
                <div>
                  <div className='font-bold text-gray-900'>Time Off Request & Approval Alerts</div>
                  <div className='text-[11px] text-gray-500'>Send immediate email alerts to managers when new leaves are requested.</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 6: System & Health */}
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
                className='px-3 py-1.5 rounded-lg text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer transition-colors'
              >
                Refresh Diagnostics
              </button>
            </div>

            {healthLoading ? (
              <div className='py-6 text-center text-gray-500'>Pinging backend health endpoint...</div>
            ) : healthError ? (
              <div className='p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1'>
                <div className='font-bold'>Backend Connection Status: Offline / Disconnected</div>
                <div className='text-[11px] text-rose-600'>{healthError}</div>
              </div>
            ) : healthData ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-emerald-700'>API Server</div>
                  <div className='text-base font-black text-emerald-900 capitalize'>{healthData.status}</div>
                </div>
                <div className='p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-blue-700'>Database Connection</div>
                  <div className='text-base font-black text-blue-900 capitalize'>{healthData.database}</div>
                </div>
                <div className='p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1'>
                  <div className='text-[10px] uppercase font-bold text-gray-500'>Server Timestamp</div>
                  <div className='text-xs font-mono font-bold text-gray-800 truncate'>{healthData.timestamp}</div>
                </div>
              </div>
            ) : (
              <div className='text-gray-400'>Click Refresh Diagnostics to test server connectivity.</div>
            )}

            <div className='pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2'>
              <span>Application Version: <strong>PeoplePay Enterprise 2026.1</strong></span>
              <span>Node Environment: <strong>Development / API Ready</strong></span>
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
