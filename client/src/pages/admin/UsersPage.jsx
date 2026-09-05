import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import authApi from '../../services/authApi.js';
import userApi from '../../services/userApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiPendingNotice, setApiPendingNotice] = useState(false);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleCode: 'EMPLOYEE',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: 'Engineering',
    status: 'Active',
  });
  const [sessionNotice, setSessionNotice] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    setError(null);
    return userApi
      .getUsers()
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setApiPendingNotice(true);
          setUsers([]);
        } else {
          setError(extractErrorMessage(err, 'Failed to load user directory.'));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    userApi
      .getUsers()
      .then((res) => {
        if (!active) return;
        setUsers(res.data || []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) {
          setApiPendingNotice(true);
          setUsers([]);
        } else {
          setError(extractErrorMessage(err, 'Failed to load user directory.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const validatePasswordStrength = (pass) => {
    const errs = [];
    if (!pass || pass.length < 8) errs.push('At least 8 characters');
    if (!/[A-Z]/.test(pass)) errs.push('One uppercase letter');
    if (!/[a-z]/.test(pass)) errs.push('One lowercase letter');
    if (!/[0-9]/.test(pass)) errs.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errs.push('One special character');
    return errs;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const passErrors = validatePasswordStrength(addFormData.password);
    if (passErrors.length > 0) {
      setFormError(`Password requirements missing: ${passErrors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: addFormData.firstName.trim(),
        lastName: addFormData.lastName.trim(),
        email: addFormData.email.trim().toLowerCase(),
        password: addFormData.password,
        roleCodes: [addFormData.roleCode],
      };

      const res = await authApi.register(payload);

      setFormSuccess(res.message || 'User created successfully in authentication database.');

      const newUserObj = {
        id: res.user?.id || `usr-${Date.now()}`,
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email,
        role: addFormData.roleCode.toLowerCase(),
        department: 'General',
        status: 'Active',
        lastActive: 'Just now',
      };

      setUsers((prev) => [newUserObj, ...prev]);

      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleCode: 'EMPLOYEE',
        });
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to register user. Please verify credentials.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'employee',
      department: user.department || 'Engineering',
      status: user.status || 'Active',
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Update local state and clearly notify about backend endpoint status
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: editFormData.name,
              email: editFormData.email,
              role: editFormData.role,
              department: editFormData.department,
              status: editFormData.status,
            }
          : u
      )
    );

    setSessionNotice(
      `User ${editFormData.name} updated in session. Note: Backend endpoint (PUT /api/users/:id) is pending development.`
    );
    setEditingUser(null);
    setTimeout(() => setSessionNotice(null), 5000);
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Users & Roles'
        subtitle='Manage authentication accounts, administrative permissions, and security roles.'
        actions={
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => navigate('/admin/employees/add')}
              className='px-3.5 py-2 text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5'
            >
              <span className='text-sm leading-none'>+</span>
              <span>Add Employee</span>
            </button>
            <button
              type='button'
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsAddModalOpen(true);
              }}
              className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5'
            >
              <span className='text-sm leading-none'>+</span>
              <span>Add Application User</span>
            </button>
          </div>
        }
      />

      {/* Backend Integration Status Banner */}
      <div className='p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0' />
          <span className='font-bold text-[#1E293B]'>Auth Integration Active:</span>
          <span className='text-gray-600'>
            New user provisioning communicates directly with backend <code className='px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[11px] font-mono text-[#714B67]'>POST /api/auth/register</code>.
          </span>
        </div>
        <span className='text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 w-fit shrink-0'>
          Admin Scope
        </span>
      </div>

      {sessionNotice && (
        <div className='p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-fadeIn flex items-center justify-between'>
          <span>{sessionNotice}</span>
          <button
            type='button'
            onClick={() => setSessionNotice(null)}
            className='text-amber-600 font-bold ml-2'
          >
            ✕
          </button>
        </div>
      )}

      {apiPendingNotice && (
        <div className='p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-2xs'>
          <div className='font-bold flex items-center gap-1.5 text-amber-950'>
            <span>⚠️</span>
            <span>Backend Directory Endpoint Pending</span>
          </div>
          <p className='text-amber-800 leading-relaxed'>
            The backend team has not yet exposed a user listing endpoint (<code className='bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]'>GET /api/users</code>). Provisioning new employee and administrative accounts is fully active and wired directly to the real backend registration service via the <strong>+ Add User</strong> button above.
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading user accounts...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState title='No users found' description='Create the first user account to grant access.' />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[11px]'>
              <tr>
                <th className='py-3.5 px-4'>User</th>
                <th className='py-3.5 px-4'>Role</th>
                <th className='py-3.5 px-4'>Department</th>
                <th className='py-3.5 px-4'>Status</th>
                <th className='py-3.5 px-4'>Last Active</th>
                <th className='py-3.5 px-4 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {users.map((u) => {
                const roleFormatted = (u.role || 'employee').replace('_', ' ').toUpperCase();
                return (
                  <tr key={u.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3.5 px-4'>
                      <div className='font-bold text-gray-900 text-xs'>{u.name}</div>
                      <div className='text-[11px] text-gray-500 font-mono'>{u.email}</div>
                    </td>
                    <td className='py-3.5 px-4'>
                      <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200'>
                        {roleFormatted}
                      </span>
                    </td>
                    <td className='py-3.5 px-4 text-gray-700 font-medium'>
                      {u.department || 'General'}
                    </td>
                    <td className='py-3.5 px-4'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className='py-3.5 px-4 text-gray-500 text-[11px]'>
                      {u.lastActive || 'Active today'}
                    </td>
                    <td className='py-3.5 px-4 text-right'>
                      <button
                        type='button'
                        onClick={() => handleOpenEdit(u)}
                        className='px-2.5 py-1 text-xs font-bold text-[#714B67] hover:text-[#5E3E56] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer'
                        aria-label={`Edit ${u.name}`}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal — Connected to POST /api/auth/register */}
      {isAddModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
          aria-labelledby='add-user-modal-title'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 id='add-user-modal-title' className='text-base font-bold text-[#1E293B]'>
                  Add New User
                </h3>
                <p className='text-xs text-gray-500'>
                  Provisions credentials via backend authentication.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsAddModalOpen(false)}
                className='p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                aria-label='Close modal'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium'>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold'>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className='space-y-3.5 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-semibold text-gray-700 mb-1'>First Name *</label>
                  <input
                    type='text'
                    required
                    value={addFormData.firstName}
                    onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                    placeholder='e.g. John'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
                  />
                </div>
                <div>
                  <label className='block font-semibold text-gray-700 mb-1'>Last Name *</label>
                  <input
                    type='text'
                    required
                    value={addFormData.lastName}
                    onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                    placeholder='e.g. Doe'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Work Email *</label>
                <input
                  type='email'
                  required
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder='john.doe@peoplepay.internal'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
                />
              </div>

              <div>
                <div className='flex items-center justify-between mb-1'>
                  <label className='font-semibold text-gray-700'>Temporary Password *</label>
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='text-[11px] font-bold text-[#714B67] hover:underline cursor-pointer'
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  placeholder='Min 8 chars, mixed case, number, symbol'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
                />
                <p className='text-[10px] text-gray-500 mt-1'>
                  Must contain: uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Role Assignment *</label>
                <select
                  value={addFormData.roleCode}
                  onChange={(e) => setAddFormData({ ...addFormData, roleCode: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
                >
                  <option value='EMPLOYEE'>Employee</option>
                  <option value='HR_MANAGER'>HR Manager</option>
                  <option value='HR_PAYROLL_USER'>HR Payroll User</option>
                  <option value='HR_PAYROLL_MANAGER'>HR Payroll Manager</option>
                  <option value='ADMIN'>System Administrator</option>
                </select>
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <BackButton
                  label='Cancel'
                  onClick={() => setIsAddModalOpen(false)}
                />
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
          aria-labelledby='edit-user-modal-title'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 id='edit-user-modal-title' className='text-base font-bold text-[#1E293B]'>
                Edit User
              </h3>
              <button
                type='button'
                onClick={() => setEditingUser(null)}
                className='text-gray-400 font-bold'
                aria-label='Close'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className='space-y-3 text-xs'>
              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Full Name *</label>
                <input
                  type='text'
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Work Email *</label>
                <input
                  type='email'
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value='employee'>Employee</option>
                  <option value='hr_manager'>HR Manager</option>
                  <option value='hr_payroll_user'>HR Payroll User</option>
                  <option value='hr_payroll_manager'>HR Payroll Manager</option>
                  <option value='admin'>Administrator</option>
                </select>
              </div>

              <div>
                <label className='block font-semibold text-gray-700 mb-1'>Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value='Active'>Active</option>
                  <option value='Inactive'>Inactive</option>
                </select>
              </div>

              <div className='p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 leading-tight'>
                Backend note: User update API (PUT /api/users/:id) is pending development. Changes apply to active session.
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setEditingUser(null)} />
                <button
                  type='submit'
                  className='px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
