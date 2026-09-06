import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import authApi from '../../services/authApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleCode: 'EMPLOYEE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  // ============ LOAD USERS FROM BACKEND ============
  // Note: Backend doesn't have GET /api/users yet
  // We'll show empty state with explanation

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: addFormData.firstName.trim(),
        lastName: addFormData.lastName.trim(),
        email: addFormData.email.trim().toLowerCase(),
        roleCodes: [addFormData.roleCode],
      };

      // Call backend register (magic link flow - no password)
      const res = await authApi.register(payload);

      setFormSuccess(res.message || 'User created. Magic link sent for password setup.');

      const newUserObj = {
        id: res.user?.id || `usr-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email,
        roleCodes: [addFormData.roleCode],
        role: addFormData.roleCode,
        isActive: true,
      };

      setUsers((prev) => [newUserObj, ...prev]);

      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddFormData({ firstName: '', lastName: '', email: '', roleCode: 'EMPLOYEE' });
        setFormSuccess(null);
      }, 2000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to create user account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRole = (roleCode) => {
    if (!roleCode) return 'EMPLOYEE';
    return roleCode.replace(/_/g, ' ');
  };

  const getRoleBadgeClass = (roleCode) => {
    switch (roleCode) {
      case 'ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HR_PAYROLL_USER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'HR_MANAGER':
        return 'bg-purple-50 text-[#714B67] border-purple-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const statusBannerDisplay = statusBanner && (
    <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
      statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <span>{statusBanner.text}</span>
      <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
    </div>
  );

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Users & Roles'
        subtitle='Manage authentication accounts, administrative permissions, and security roles.'
        actions={
          <button
            type='button'
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setIsAddModalOpen(true);
            }}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5'
          >
            <span className='text-sm leading-none'>+</span>
            <span>Add Application User</span>
          </button>
        }
      />

      {/* Status Banner */}
      {statusBannerDisplay}

      {/* Info Banner */}
      <div className='p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs flex items-center gap-2 shadow-2xs'>
        <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0' />
        <span className='font-bold text-[#1E293B]'>Auth Integration Active:</span>
        <span className='text-gray-600'>
          New user provisioning communicates directly with backend <code className='px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[11px] font-mono text-[#714B67]'>POST /api/auth/register</code>.
        </span>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <EmptyState
          title='No users in session'
          description='Add your first application user using the Add Application User button. New users will receive a magic link for password setup.'
          actionLabel='+ Add Application User'
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[11px]'>
              <tr>
                <th className='py-3.5 px-4'>User</th>
                <th className='py-3.5 px-4'>Role</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4'>Last Active</th>
                <th className='py-3.5 px-4 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {users.map((u) => (
                <tr key={u.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                  <td className='py-3.5 px-4'>
                    <div className='font-bold text-gray-900 text-xs'>{u.name || `${u.firstName} ${u.lastName}`}</div>
                    <div className='text-[11px] text-gray-500 font-mono'>{u.email}</div>
                  </td>
                  <td className='py-3.5 px-4'>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(u.roleCodes?.[0] || u.role)}`}>
                      {formatRole(u.roleCodes?.[0] || u.role)}
                    </span>
                  </td>
                  <td className='py-3.5 px-4'>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className='py-3.5 px-4 text-gray-500 text-[11px]'>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                  </td>
                  <td className='py-3.5 px-4 text-right'>
                    <button
                      type='button'
                      onClick={() => {
                        // Resend magic link
                        authApi.resendMagicLink({ email: u.email }).then(() => {
                          setStatusBanner({ type: 'success', text: `Magic link resent to ${u.email}` });
                          setTimeout(() => setStatusBanner(null), 4000);
                        }).catch(() => {
                          setStatusBanner({ type: 'error', text: 'Failed to resend magic link' });
                          setTimeout(() => setStatusBanner(null), 4000);
                        });
                      }}
                      className='px-2.5 py-1 text-xs font-bold text-[#714B67] hover:text-[#5E3E56] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer'
                    >
                      Resend Magic Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn' role='dialog' aria-modal='true' aria-labelledby='add-user-modal-title'>
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 id='add-user-modal-title' className='text-base font-bold text-[#1E293B]'>Add New User</h3>
                <p className='text-xs text-gray-500'>Provisions credentials via backend authentication.</p>
              </div>
              <button type='button' onClick={() => setIsAddModalOpen(false)} className='p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium'>{formError}</div>}
            {formSuccess && <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold'>{formSuccess}</div>}

            <form onSubmit={handleAddSubmit} className='space-y-3.5 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-semibold text-gray-700 mb-1'>First Name *</label>
                  <input type='text' required value={addFormData.firstName} onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })} placeholder='e.g. John' className='w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#714B67]' />
                </div>
                <div>
                  <label className='block font-semibold text-gray-700 mb-1'>Last Name *</label>
                  <input type='text' required value={addFormData.lastName} onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })} placeholder='e.g. Doe' className='w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#714B67]' />
                </div>
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Work Email *</label>
                <input type='email' required value={addFormData.email} onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })} placeholder='john.doe@peoplepay.com' className='w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#714B67]' />
              </div>

              <div className='p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs flex items-start gap-2'>
                <span>✉</span>
                <div>
                  <p className='font-bold text-[#1E293B]'>Magic Link Password Setup</p>
                  <p className='text-gray-600 mt-0.5'>No password required. A secure activation magic link will be emailed.</p>
                </div>
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Role Assignment *</label>
                <select value={addFormData.roleCode} onChange={(e) => setAddFormData({ ...addFormData, roleCode: e.target.value })} className='w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]'>
                  <option value='EMPLOYEE'>Employee</option>
                  <option value='HR_MANAGER'>HR Manager</option>
                  <option value='HR_PAYROLL_USER'>HR Payroll User</option>
                  <option value='HR_PAYROLL_MANAGER'>HR Payroll Manager</option>
                  <option value='ADMIN'>System Administrator</option>
                </select>
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsAddModalOpen(false)}
                  className='px-4 py-2 font-semibold text-gray-700 hover:text-gray-900 border rounded-xl hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button type='submit' disabled={isSubmitting} className={`px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}