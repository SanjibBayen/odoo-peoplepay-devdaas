import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import userApi from '../../services/userApi.js';
import { INITIAL_USERS } from '../../data/adminData.js';

export default function UsersPage() {
  const [users, setUsers] = useState(() => INITIAL_USERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: 'Engineering',
    status: 'Active',
  });

  const loadUsers = () => {
    userApi
      .getUsers()
      .then((res) => {
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load users');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await userApi.createUser(formData);
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='User Management'
        subtitle='Manage application access, role assignments, and authentication accounts.'
        actions={
          <button
            type='button'
            onClick={() => setIsModalOpen(true)}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Invite User</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Loading user accounts...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState title='No users found' />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
              <tr>
                <th className='py-3 px-4'>User</th>
                <th className='py-3 px-4'>Role</th>
                <th className='py-3 px-4'>Department</th>
                <th className='py-3 px-4'>Status</th>
                <th className='py-3 px-4'>Last Active</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {users.map((u) => (
                <tr key={u.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                  <td className='py-3 px-4'>
                    <div className='font-bold text-gray-900'>{u.name}</div>
                    <div className='text-[10px] text-gray-500'>{u.email}</div>
                  </td>
                  <td className='py-3 px-4'>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200'>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className='py-3 px-4 text-gray-700 font-medium'>
                    {u.department}
                  </td>
                  <td className='py-3 px-4'>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                      {u.status}
                    </span>
                  </td>
                  <td className='py-3 px-4 text-gray-500 text-[11px]'>
                    {u.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite User Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>Invite User</h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Full Name *</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Work Email *</label>
                <input
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value='employee'>Employee</option>
                  <option value='hr_manager'>HR Manager</option>
                  <option value='hr_payroll_user'>HR Payroll User</option>
                  <option value='hr_payroll_manager'>HR Payroll Manager</option>
                  <option value='admin'>Administrator</option>
                </select>
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-3 py-1.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-lg cursor-pointer'
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
