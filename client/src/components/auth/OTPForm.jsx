import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice.js';
import authApi from '../../services/authApi.js';

/**
 * Clean, compact PeoplePay 2FA Login OTP verification form.
 *
 * @param {Object} props
 * @param {string} props.email - Target user work email
 * @param {string} [props.roleSlug] - Prior role context for fallback redirect
 * @param {Function} [props.onSuccess] - Callback when verification completes
 */
export default function OTPForm({ email, roleSlug = 'employee', onSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanOtp.length < 4) {
      setError('Please enter a valid verification code.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Verify OTP with backend
      const verifyRes = await authApi.verifyLoginOTP({
        email,
        otp: cleanOtp,
      });

      const token = verifyRes.token;

      // 2. Fetch authoritative user profile and permissions from GET /auth/me
      let authoritativeUser = verifyRes.user;
      try {
        const meRes = await authApi.getMe();
        if (meRes?.user) {
          authoritativeUser = meRes.user;
        }
      } catch (meErr) {
        console.warn('Could not fetch /auth/me profile immediately', meErr.message);
      }

      // 3. Commit credentials to Redux store
      dispatch(
        setCredentials({
          user: authoritativeUser,
          token,
        })
      );

      // 4. Navigate to authoritative role dashboard
      const userRoles = authoritativeUser.roles || [];
      const primaryRole = (
        typeof userRoles[0] === 'string'
          ? userRoles[0]
          : userRoles[0]?.code || roleSlug
      )
        .toLowerCase()
        .replace('-', '_');

      const targetSlug = primaryRole.replace('_', '-');

      if (onSuccess) {
        onSuccess(targetSlug);
      } else {
        navigate(`/dashboard/${targetSlug}`, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Please check the code and try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await authApi.resendLoginOTP({ email });
      setInfoMessage(res.message || 'A new verification code has been sent to your email.');
      setCooldown(30);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to resend code. Please wait a moment.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const loginFallbackRoute = `/login/${roleSlug ? roleSlug.replace('_', '-') : 'employee'}`;

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE6DF] shadow-xl relative'>
        {/* Brand Header */}
        <div className='text-center mb-6 space-y-2'>
          <Link
            to='/'
            className='inline-flex items-center justify-center gap-2.5 group'
            aria-label='Back to PeoplePay home'
          >
            <div className='w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-105 transition-transform'>
              <svg viewBox='0 0 40 40' fill='none' className='w-full h-full' aria-hidden='true'>
                <circle cx='13' cy='17' r='5' fill='#34D399' />
                <path d='M6 31c0-4 3.5-7 7-7s7 3 7 7' fill='#34D399' opacity='0.85' />
                <circle cx='20' cy='13' r='6' fill='#714B67' />
                <path d='M12 29c0-4.5 4-8 8-8s8 3.5 8 8' fill='#714B67' />
                <circle cx='27' cy='17' r='5' fill='#FB923C' />
                <path d='M20 31c0-4 3.5-7 7-7s7 3 7 7' fill='#FB923C' opacity='0.85' />
              </svg>
            </div>
            <span className='text-xl font-black tracking-tight text-[#1E293B]'>PeoplePay</span>
          </Link>

          <div>
            <h1 className='text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight'>
              Verify Your Login
            </h1>
            <p className='text-xs sm:text-sm text-gray-500 mt-1 font-normal'>
              Enter the verification code sent to{' '}
              <strong className='text-gray-700 font-semibold'>{email}</strong>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role='alert'
            className='mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-fadeIn'
          >
            <svg
              className='w-4 h-4 shrink-0 text-rose-500'
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
            <span>{error}</span>
          </div>
        )}

        {/* Info Feedback Notice */}
        {infoMessage && (
          <div
            role='status'
            className='mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn'
          >
            <svg
              className='w-4 h-4 shrink-0 text-emerald-600'
              fill='currentColor'
              viewBox='0 0 20 20'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className='space-y-4'>
          <div>
            <label
              htmlFor='otp-input'
              className='block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5'
            >
              One-Time Password (OTP)
            </label>
            <input
              id='otp-input'
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              maxLength={6}
              disabled={isSubmitting}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder='••••••'
              autoFocus
              className='w-full text-center tracking-[0.6em] text-2xl font-bold py-3 px-4 rounded-xl bg-[#FAF8F5] border border-gray-200 text-[#1E293B] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all'
            />
          </div>

          {/* Submit Button */}
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
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Sign In →</span>
            )}
          </button>

          {/* Resend OTP Row */}
          <div className='flex items-center justify-between pt-1 text-xs'>
            <span className='text-gray-500'>Didn&apos;t receive the code?</span>
            {cooldown > 0 ? (
              <span className='text-gray-400 font-medium'>Resend in {cooldown}s</span>
            ) : (
              <button
                type='button'
                onClick={handleResend}
                disabled={isResending}
                className='font-bold text-[#714B67] hover:underline cursor-pointer disabled:opacity-50'
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </form>

        {/* Back Link */}
        <div className='mt-6 pt-5 border-t border-gray-100 text-center'>
          <Link
            to={loginFallbackRoute}
            className='inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#1E293B] transition-colors rounded'
          >
            <span>←</span>
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
