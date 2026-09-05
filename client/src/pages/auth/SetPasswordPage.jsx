import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authApi from '../../services/authApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyError, setVerifyError] = useState(
    token ? null : 'No invitation or magic link token was found in the URL.'
  );
  const [userInfo, setUserInfo] = useState(null);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(null);
  const [resendError, setResendError] = useState(null);

  // Live password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = Boolean(password && password === confirmPassword);
  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    authApi
      .verifyMagicLink(token)
      .then((res) => {
        if (isMounted) {
          setTokenValid(true);
          if (res.user) {
            setUserInfo(res.user);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          const status = err.response?.status;
          const msg = err.response?.data?.message || err.message || '';

          if (status === 404 || status === 501) {
            // Fallback if verification route is bypassable
            setTokenValid(true);
          } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('used')) {
            setVerifyError('This magic link has already been used. Please log in or request a new one.');
          } else if (msg.toLowerCase().includes('expired')) {
            setVerifyError('This magic link is invalid or has expired.');
          } else if (!err.response) {
            setVerifyError('Unable to connect to the PeoplePay server. Please check your network connection.');
          } else {
            setVerifyError(extractErrorMessage(err, 'This magic link is invalid or has expired.'));
          }
        }
      })
      .finally(() => {
        if (isMounted) setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!isFormValid) {
      setFormError('Please ensure all password security requirements are met.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.setPasswordViaMagicLink({
        token,
        newPassword: password,
        confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login/employee');
      }, 3000);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || '';

      if (status === 400 && msg.toLowerCase().includes('expired')) {
        setFormError('This magic link is invalid or has expired.');
      } else if (status === 400 && msg.toLowerCase().includes('used')) {
        setFormError('This magic link has already been used.');
      } else if (!err.response) {
        setFormError('Unable to connect to the PeoplePay server. Please try again.');
      } else {
        setFormError(extractErrorMessage(err, 'Failed to set password. Link may have expired.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(null);

    if (!resendEmail.trim()) {
      setResendError('Please enter your work email.');
      return;
    }

    setResending(true);
    try {
      await authApi.resendMagicLink({ email: resendEmail.trim() });
      setResendSuccess('A new invitation link has been dispatched to your email.');
    } catch (err) {
      setResendError(extractErrorMessage(err, 'Unable to resend invitation link.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden'>
      {/* Decorative background shapes */}
      <div
        className='absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-100/30 blur-3xl pointer-events-none'
        aria-hidden='true'
      />
      <div
        className='absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl pointer-events-none'
        aria-hidden='true'
      />

      <div className='w-full max-w-md bg-white rounded-2xl border border-[#EAE6DF] shadow-xl p-8 relative z-10'>
        {/* Brand Header */}
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#714B67] text-white font-black text-xl shadow-md shadow-[#714B67]/20 mb-3'>
            P
          </div>
          <h1 className='text-2xl font-black text-[#1E293B] tracking-tight'>PeoplePay</h1>
          <p className='text-xs text-gray-500 font-caveat text-lg mt-0.5'>Account Setup & Password</p>
        </div>

        {verifying && (
          <div className='py-8 text-center'>
            <div className='inline-block w-8 h-8 border-3 border-[#714B67] border-t-transparent rounded-full animate-spin mb-3' />
            <p className='text-xs font-bold text-gray-600'>Verifying your invitation link...</p>
          </div>
        )}

        {!verifying && verifyError && (
          <div>
            <div className='p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5 flex items-start gap-2.5'>
              <div className='w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
                !
              </div>
              <div>
                <p className='font-bold text-rose-900'>Invalid Invitation Link</p>
                <p className='mt-0.5 text-[11px] text-rose-700'>{verifyError}</p>
              </div>
            </div>

            <p className='text-xs text-gray-600 mb-3'>
              Need a new invitation link? Enter your work email to request a fresh setup link:
            </p>
            <form onSubmit={handleResend} className='space-y-3'>
              <input
                type='email'
                placeholder='colleague@peoplepay.com'
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE6DF] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]'
              />
              {resendError && <p className='text-xs text-rose-600 font-medium'>{resendError}</p>}
              {resendSuccess && <p className='text-xs text-emerald-600 font-medium'>{resendSuccess}</p>}
              <button
                type='submit'
                disabled={resending}
                className='w-full py-2.5 px-4 rounded-xl bg-[#714B67] text-white text-xs font-bold hover:bg-[#5E3E56] transition-all disabled:opacity-50 cursor-pointer'
              >
                {resending ? 'Sending...' : 'Resend Invitation Link'}
              </button>
            </form>

            <div className='mt-6 pt-4 border-t border-[#EAE6DF] text-center'>
              <Link to='/login/employee' className='text-xs text-[#714B67] hover:underline font-bold'>
                Return to Login
              </Link>
            </div>
          </div>
        )}

        {!verifying && tokenValid && !success && (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='text-center mb-3'>
              {userInfo ? (
                <div>
                  <p className='text-sm font-bold text-[#1E293B]'>
                    Welcome, {userInfo.firstName} {userInfo.lastName}!
                  </p>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    Set your account password for <strong>{userInfo.email}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <p className='text-sm font-bold text-[#1E293B]'>Welcome! Set your account password</p>
                  <p className='text-xs text-gray-500 mt-0.5'>Choose a secure password to activate your account</p>
                </div>
              )}
            </div>

            {formError && (
              <div className='p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2'>
                <span className='font-bold text-rose-900 shrink-0'>!</span>
                <span>{formError}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1'>New Password</label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter new password'
                  className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE6DF] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] pr-12'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-semibold cursor-pointer select-none'
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1'>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Re-enter password'
                className='w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE6DF] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]'
              />
            </div>

            {/* Password Requirement Indicators */}
            <div className='p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 text-[11px]'>
              <p className='font-bold text-gray-700 mb-1'>Password Requirements:</p>
              <div className='grid grid-cols-2 gap-1.5'>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{hasMinLength ? '✓' : '○'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{hasUppercase ? '✓' : '○'}</span>
                  <span>1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{hasLowercase ? '✓' : '○'}</span>
                  <span>1 lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{hasNumber ? '✓' : '○'}</span>
                  <span>1 number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{hasSpecial ? '✓' : '○'}</span>
                  <span>1 special character</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <span>{passwordsMatch ? '✓' : '○'}</span>
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            <button
              type='submit'
              disabled={!isFormValid || submitting}
              className='w-full py-2.5 px-4 rounded-xl bg-[#714B67] text-white text-xs font-bold hover:bg-[#5E3E56] transition-all shadow-xs hover:shadow disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2'
            >
              {submitting ? 'Setting Password...' : 'Save Password & Proceed'}
            </button>

            <div className='pt-2 text-center'>
              <Link to='/login/employee' className='text-xs text-gray-500 hover:text-gray-800 font-medium'>
                Back to sign in
              </Link>
            </div>
          </form>
        )}

        {success && (
          <div className='py-6 text-center space-y-3'>
            <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-1 font-bold text-lg'>
              ✓
            </div>
            <h2 className='text-lg font-black text-[#1E293B]'>Password set successfully!</h2>
            <p className='text-xs text-gray-600 max-w-xs mx-auto'>
              You can now sign in to PeoplePay. Redirecting you to sign in...
            </p>
            <div className='pt-2'>
              <Link
                to='/login/employee'
                className='inline-block px-5 py-2.5 rounded-xl bg-[#714B67] text-white text-xs font-bold hover:bg-[#5E3E56] transition-all shadow-xs'
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
