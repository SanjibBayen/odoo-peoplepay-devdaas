import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import RoleBadge from './RoleBadge.jsx';
import authApi from '../../services/authApi.js';
import { setCredentials } from '../../redux/slices/authSlice.js';

/**
 * Reusable, accessible login form component for PeoplePay.
 * Connects to real backend POST /auth/login and triggers OTP verification.
 *
 * @param {Object} props
 * @param {Object} props.role - Role configuration object
 */
export default function LoginForm({ role }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const defaultRole = {
    name: 'PeoplePay',
    title: 'Sign In to PeoplePay',
    subtitle: 'Enter your work credentials to access your workspace',
    slug: 'employee',
  };
  const activeRole = role || defaultRole;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Forgot / Reset Password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState(null);

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

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await authApi.login({
        email: normalizedEmail,
        password,
      });

      if (result.requiresOTP) {
        navigate(`/login/verify-otp?email=${encodeURIComponent(normalizedEmail)}`, {
          state: {
            email: normalizedEmail,
            roleSlug: activeRole.slug,
          },
        });
      } else if (result.token) {
        dispatch(
          setCredentials({
            user: result.user,
            token: result.token,
          })
        );

        const userRoles = result.user?.roles || [];
        const primaryRole = (
          typeof userRoles[0] === 'string'
            ? userRoles[0]
            : userRoles[0]?.code || activeRole.slug
        ).toUpperCase();

        if (primaryRole === 'ADMIN') navigate('/admin/dashboard');
        else if (primaryRole === 'HR_PAYROLL_MANAGER') navigate('/hr-payroll-manager/dashboard');
        else if (primaryRole === 'HR_PAYROLL_USER') navigate('/hr-payroll-user/dashboard');
        else if (primaryRole === 'HR_MANAGER') navigate('/hr-manager/dashboard');
        else navigate('/employee/dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const rawMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';

      if (status === 403 && (rawMsg.toLowerCase().includes('password not set') || rawMsg.toLowerCase().includes('password'))) {
        setErrors({
          form: 'Your password has not been set yet. Please check your email for the magic link invitation to set your password.',
        });
      } else {
        setErrors({
          form: rawMsg || 'Invalid email or password. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your work email.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await authApi.forgotPassword({
        email: forgotEmail.trim().toLowerCase(),
      });
      setForgotSuccessMsg(res.message || 'Password reset OTP sent to your email.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(
        err.response?.data?.message || err.message || 'Failed to send reset code.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setForgotError('Please enter the OTP verification code.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await authApi.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        newPassword: resetNewPassword,
      });
      setForgotSuccessMsg(
        res.message || 'Password reset successful. Please sign in with your new password.'
      );
      setForgotStep(3);
    } catch (err) {
      setForgotError(
        err.response?.data?.message || err.message || 'Password reset failed.'
      );
    } finally {
      setForgotLoading(false);
    }
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
            <RoleBadge role={activeRole} />
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
              {activeRole.title}
            </h1>
            <p className='text-xs sm:text-sm text-gray-500 mt-0.5 font-normal'>
              {activeRole.subtitle}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {errors.form && (
          <div
            className='mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium'
            role='alert'
          >
            {errors.form}
          </div>
        )}

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
                  setForgotStep(1);
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {activeRole.name}</span>
                  <span aria-hidden='true'>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Alternate Role Switching & Back Links */}
        <div className='mt-8 pt-6 border-t border-gray-100 space-y-3 text-center'>
          <p className='text-xs text-gray-500'>
            Not an {activeRole.name}?{' '}
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

      {/* Accessible Forgot & Reset Password Dialog Modal */}
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
                className='text-base font-bold text-[#1E293B]'
              >
                {forgotStep === 3
                  ? 'Password Reset'
                  : forgotStep === 2
                  ? 'Enter Verification Code'
                  : 'Reset Password'}
              </h3>
              <button
                type='button'
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotStep(1);
                  setForgotError(null);
                }}
                className='p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
                aria-label='Close modal'
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div
                className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium'
                role='alert'
              >
                {forgotError}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleSendResetOTP} className='space-y-3'>
                <p className='text-xs text-gray-600'>
                  Enter your registered work email to receive a 6-digit password recovery code.
                </p>
                <div>
                  <label htmlFor='modal-forgot-email' className='sr-only'>
                    Work Email
                  </label>
                  <input
                    id='modal-forgot-email'
                    type='email'
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    placeholder='work.email@company.com'
                    className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
                  />
                </div>
                <div className='flex gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={() => setForgotModalOpen(false)}
                    className='w-1/2 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={forgotLoading}
                    className='w-1/2 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] disabled:opacity-70 rounded-xl shadow-xs transition-colors cursor-pointer'
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className='space-y-3'>
                <p className='text-xs text-gray-600'>
                  We sent a 6-digit code to{' '}
                  <span className='font-semibold text-gray-800'>{forgotEmail}</span>. Enter it below along with your new password.
                </p>
                <div>
                  <label
                    htmlFor='modal-reset-otp'
                    className='block text-xs font-semibold text-gray-700 mb-1'
                  >
                    6-Digit Code
                  </label>
                  <input
                    id='modal-reset-otp'
                    type='text'
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) => {
                      setResetOtp(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    placeholder='123456'
                    className='w-full px-3 py-2.5 rounded-xl text-xs font-mono tracking-widest bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
                  />
                </div>
                <div>
                  <label
                    htmlFor='modal-reset-new-password'
                    className='block text-xs font-semibold text-gray-700 mb-1'
                  >
                    New Password
                  </label>
                  <input
                    id='modal-reset-new-password'
                    type='password'
                    required
                    minLength={8}
                    value={resetNewPassword}
                    onChange={(e) => {
                      setResetNewPassword(e.target.value);
                      if (forgotError) setForgotError(null);
                    }}
                    placeholder='At least 8 characters'
                    className='w-full px-3 py-2.5 rounded-xl text-xs bg-[#FAF8F5] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#714B67]'
                  />
                  <p className='text-[10px] text-gray-500 mt-1'>
                    Must contain uppercase, lowercase, number, and special character.
                  </p>
                </div>
                <div className='flex gap-2 pt-2'>
                  <button
                    type='button'
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    className='w-1/3 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer'
                  >
                    Back
                  </button>
                  <button
                    type='submit'
                    disabled={forgotLoading}
                    className='w-2/3 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] disabled:opacity-70 rounded-xl shadow-xs transition-colors cursor-pointer'
                  >
                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <div className='space-y-3'>
                <div
                  className='p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium'
                  role='status'
                >
                  {forgotSuccessMsg}
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotStep(1);
                    setResetOtp('');
                    setResetNewPassword('');
                    setForgotError(null);
                  }}
                  className='w-full py-2.5 px-4 bg-[#714B67] text-white rounded-xl text-xs font-bold hover:bg-[#5E3E56] transition-colors cursor-pointer'
                >
                  Close & Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
