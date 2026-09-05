import React, { useState } from 'react';
import authApi from '../../services/authApi.js';
import useLogout from '../../hooks/useLogout.js';

/**
 * ChangePasswordModal component for authenticated users.
 * Connects to POST /auth/change-password.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Close callback
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const logout = useLogout();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage(
        res.message || 'Password changed successfully. Please log in again.'
      );

      // Backend terminates all sessions on password change.
      // Give user 2 seconds to view success then log out gracefully.
      setTimeout(() => {
        handleClose();
        logout();
      }, 2000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to change password. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs'
      role='dialog'
      aria-modal='true'
      aria-labelledby='change-password-modal-title'
    >
      <div className='bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-4 animate-fadeIn'>
        {/* Header */}
        <div className='flex items-center justify-between pb-2 border-b border-gray-100'>
          <div>
            <h3
              id='change-password-modal-title'
              className='text-base font-bold text-[#1E293B]'
            >
              Change Password
            </h3>
            <p className='text-xs text-gray-500'>
              Update your account password to maintain security.
            </p>
          </div>
          <button
            type='button'
            onClick={handleClose}
            className='p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
            aria-label='Close modal'
          >
            ✕
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium'
            role='alert'
          >
            {errorMessage}
          </div>
        )}

        {successMessage ? (
          <div className='space-y-4 py-2'>
            <div
              className='p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium space-y-1'
              role='status'
            >
              <p className='font-bold'>{successMessage}</p>
              <p className='text-emerald-700'>
                Redirecting to the login screen...
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                handleClose();
                logout();
              }}
              className='w-full py-2.5 px-4 bg-[#714B67] text-white rounded-xl text-xs font-bold hover:bg-[#5E3E56] transition-colors cursor-pointer'
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-3.5'>
            {/* Current Password */}
            <div>
              <label
                htmlFor='change-curr-pass'
                className='block text-xs font-semibold text-gray-700 mb-1'
              >
                Current Password
              </label>
              <input
                id='change-curr-pass'
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder='Enter current password'
                className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor='change-new-pass'
                className='block text-xs font-semibold text-gray-700 mb-1'
              >
                New Password
              </label>
              <input
                id='change-new-pass'
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder='Minimum 8 characters'
                className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
              />
              <p className='text-[10px] text-gray-500 mt-1'>
                Must include uppercase, lowercase, number, and special character.
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor='change-conf-pass'
                className='block text-xs font-semibold text-gray-700 mb-1'
              >
                Confirm New Password
              </label>
              <input
                id='change-conf-pass'
                type={showPasswords ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder='Re-type new password'
                className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
              />
            </div>

            {/* Show/Hide Checkbox */}
            <div className='flex items-center justify-between pt-1'>
              <label className='flex items-center gap-2 cursor-pointer select-none'>
                <input
                  type='checkbox'
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className='w-3.5 h-3.5 rounded border-gray-300 text-[#714B67] focus:ring-[#714B67] accent-[#714B67]'
                />
                <span className='text-xs text-gray-600 font-medium'>
                  Show passwords
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className='flex gap-2 pt-3 border-t border-gray-100'>
              <button
                type='button'
                onClick={handleClose}
                className='w-1/2 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='w-1/2 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] disabled:opacity-70 rounded-xl shadow-xs transition-colors cursor-pointer'
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}