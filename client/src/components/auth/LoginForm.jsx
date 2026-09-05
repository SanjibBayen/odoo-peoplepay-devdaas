import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RoleBadge from './RoleBadge.jsx';

/**
 * Reusable, accessible login form component for PeoplePay.
 *
 * @param {Object} props
 * @param {Object} props.role - Role configuration object
 */
export default function LoginForm({ role }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Work email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    // Simulate brief asynchronous authentication submission
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('peoplepay_role', role.slug);
      }
      setIsSubmitting(false);
      navigate(role.dashboardRoute);
    }, 750);
  };

  const handleAutofillDemo = () => {
    setEmail(role.demoEmail || 'user@company.com');
    setPassword('DemoPass2026!');
    setErrors({});
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      {/* Main Card Container */}
      <div className='bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE6DF] shadow-xl relative'>
        {/* Card Header: Brand, Portal Badge, Welcome */}
        <div className='text-center mb-6 space-y-3'>
          {/* Logo & Brand */}
          <Link
            to='/'
            className='inline-flex items-center justify-center gap-2.5 group'
            aria-label='Back to PeoplePay home'
          >
            <div className='w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform'>
              <svg
                viewBox='0 0 40 40'
                fill='none'
                className='w-full h-full'
                aria-hidden='true'
              >
                <circle cx='13' cy='17' r='5' fill='#34D399' />
                <path
                  d='M6 31c0-4 3.5-7 7-7s7 3 7 7'
                  fill='#34D399'
                  opacity='0.85'
                />
                <circle cx='20' cy='13' r='6' fill='#714B67' />
                <path d='M12 29c0-4.5 4-8 8-8s8 3.5 8 8' fill='#714B67' />
                <circle cx='27' cy='17' r='5' fill='#FB923C' />
                <path
                  d='M20 31c0-4 3.5-7 7-7s7 3 7 7'
                  fill='#FB923C'
                  opacity='0.85'
                />
              </svg>
            </div>
            <span className='text-xl font-black tracking-tight text-[#1E293B]'>
              PeoplePay
            </span>
          </Link>

          {/* Portal Badge + Autofill button */}
          <div className='flex items-center justify-center gap-2'>
            <RoleBadge role={role} />
            <button
              type='button'
              onClick={handleAutofillDemo}
              className='text-[11px] font-semibold text-[#714B67] hover:underline bg-purple-50 hover:bg-purple-100/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer'
              title='Autofill sample credentials'
            >
              Demo
            </button>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className='text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight'>
              {role.title}
            </h1>
            <p className='text-xs sm:text-sm text-gray-500 mt-0.5 font-normal'>
              {role.subtitle}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          {/* Work Email Field */}
          <div>
            <label
              htmlFor='work-email'
              className='block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5'
            >
              Work Email <span className='text-rose-500'>*</span>
            </label>
            <div className='relative'>
              <input
                id='work-email'
                name='email'
                type='email'
                autoComplete='email'
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                placeholder={role.demoEmail || 'you@company.com'}
                aria-required='true'
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#FAF8F5] border transition-all text-[#1E293B] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent ${
                  errors.email
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              />
            </div>
            {errors.email && (
              <p
                id='email-error'
                role='alert'
                className='mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1 animate-fadeIn'
              >
                <svg
                  className='w-3.5 h-3.5 shrink-0'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field with Visibility Toggle */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label
                htmlFor='password'
                className='block text-xs font-bold uppercase tracking-wider text-gray-700'
              >
                Password <span className='text-rose-500'>*</span>
              </label>
              <button
                type='button'
                onClick={() => {
                  setForgotSent(false);
                  setForgotEmail(email);
                  setForgotModalOpen(true);
                }}
                className='text-xs font-semibold text-[#714B67] hover:underline focus:outline-none focus:ring-1 focus:ring-[#714B67] rounded cursor-pointer'
              >
                Forgot password?
              </button>
            </div>
            <div className='relative'>
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                disabled={isSubmitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                placeholder='Enter your password'
                aria-required='true'
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                className={`w-full px-4 py-3 pr-12 rounded-xl text-sm font-medium bg-[#FAF8F5] border transition-all text-[#1E293B] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent ${
                  errors.password
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#714B67] rounded-lg cursor-pointer'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth='2'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth='2'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id='password-error'
                role='alert'
                className='mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1 animate-fadeIn'
              >
                <svg
                  className='w-3.5 h-3.5 shrink-0'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className='flex items-center justify-between pt-1'>
            <label className='flex items-center gap-2 cursor-pointer select-none'>
              <input
                type='checkbox'
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className='w-4 h-4 rounded border-gray-300 text-[#714B67] focus:ring-[#714B67] accent-[#714B67]'
              />
              <span className='text-xs font-medium text-gray-600'>
                Remember this device
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className='pt-2'>
            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-[#714B67] hover:bg-[#5E3E56] disabled:opacity-75 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:ring-offset-2'
            >
              {isSubmitting ? (
                <>
                  <svg
                    className='animate-spin h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {role.name}</span>
                  <span aria-hidden='true'>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Alternate Role Switching & Back Links */}
        <div className='mt-8 pt-6 border-t border-gray-100 space-y-3 text-center'>
          <p className='text-xs text-gray-500'>
            Not an {role.name}?{' '}
            <Link
              to='/'
              className='font-bold text-[#714B67] hover:underline focus:outline-none focus:ring-1 focus:ring-[#714B67] rounded'
            >
              Switch workspace
            </Link>
          </p>

          <div>
            <Link
              to='/'
              className='inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#1E293B] transition-colors focus:outline-none focus:ring-1 focus:ring-[#714B67] rounded'
            >
              <span>←</span>
              <span>Back to PeoplePay</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Accessible Forgot Password Dialog Modal */}
      {forgotModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs'
          role='dialog'
          aria-modal='true'
          aria-labelledby='forgot-dialog-title'
        >
          <div className='bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4 animate-fadeIn'>
            <div className='flex items-center justify-between'>
              <h3
                id='forgot-dialog-title'
                className='text-lg font-bold text-[#1E293B]'
              >
                Reset Password
              </h3>
              <button
                type='button'
                onClick={() => setForgotModalOpen(false)}
                className='p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                aria-label='Close modal'
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className='space-y-3'>
                <div className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium'>
                  Password reset link has been dispatched to{' '}
                  <strong>{forgotEmail || email || 'your email'}</strong>. Check
                  your inbox.
                </div>
                <button
                  type='button'
                  onClick={() => setForgotModalOpen(false)}
                  className='w-full py-2.5 px-4 bg-[#714B67] text-white rounded-xl text-xs font-bold hover:bg-[#5E3E56]'
                >
                  Close
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <p className='text-xs text-gray-600'>
                  Enter your registered work email to receive password recovery
                  instructions.
                </p>
                <input
                  type='email'
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder='work.email@company.com'
                  className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
                />
                <div className='flex gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={() => setForgotModalOpen(false)}
                    className='w-1/2 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={() => setForgotSent(true)}
                    className='w-1/2 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl'
                  >
                    Send Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
