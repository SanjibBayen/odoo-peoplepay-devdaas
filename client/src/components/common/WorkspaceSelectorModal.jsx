import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES_LIST } from '../../constants/roles.js';

/**
 * WorkspaceSelectorModal provides a role-selection experience
 * when the user clicks Login or Get Started on the landing page.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function WorkspaceSelectorModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectRole = (route) => {
    onClose();
    navigate(route);
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn'
      role='dialog'
      aria-modal='true'
      aria-labelledby='workspace-modal-title'
      onClick={onClose}
    >
      <div
        className='bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#EAE6DF] shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div>
            <div className='inline-block -rotate-1 mb-1'>
              <span className='font-handwriting text-lg text-[#714B67] marker-pink px-2 py-0.5 font-bold'>
                Personalized Workspaces
              </span>
            </div>
            <h2
              id='workspace-modal-title'
              className='text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight'
            >
              Choose your workspace
            </h2>
            <p className='text-xs sm:text-sm text-gray-600 mt-1'>
              Select your role to access your dedicated PeoplePay portal.
            </p>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-colors cursor-pointer'
            aria-label='Close workspace selection dialog'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Role Selection List */}
        <div className='space-y-3' role='list'>
          {ROLES_LIST.map((role) => {
            const { badgeStyles } = role;
            return (
              <button
                key={role.id}
                type='button'
                onClick={() => handleSelectRole(role.loginRoute)}
                className='w-full p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-[#714B67] shadow-2xs hover:shadow-md transition-all group flex items-center justify-between text-left cursor-pointer transform hover:-translate-y-0.5'
              >
                <div className='flex items-center gap-3.5'>
                  {/* Role Icon */}
                  <div className='w-11 h-11 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0 select-none'>
                    {role.icon}
                  </div>

                  {/* Role Details */}
                  <div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-sm sm:text-base font-bold text-[#1E293B] group-hover:text-[#714B67] transition-colors'>
                        {role.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles.bg} ${badgeStyles.border} ${badgeStyles.text}`}
                      >
                        {role.roleIndicator}
                      </span>
                    </div>
                    <p className='text-xs text-gray-500 mt-0.5 line-clamp-1'>
                      {role.tagline}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className='w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#714B67] text-gray-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 ml-2'>
                  <span className='text-sm font-bold'>→</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className='pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-400'>
          <span>PeoplePay Role-Based Access Control</span>
          <button
            type='button'
            onClick={onClose}
            className='text-xs text-gray-500 hover:text-[#714B67] font-semibold cursor-pointer'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
