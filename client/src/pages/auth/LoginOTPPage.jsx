import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import OTPForm from '../../components/auth/OTPForm.jsx';

/**
 * Dedicated 2FA OTP Verification Page.
 * Centered horizontally and vertically, matching the 5 PeoplePay login pages.
 */
export default function LoginOTPPage() {
  const location = useLocation();
  const email = location.state?.email;
  const roleSlug = location.state?.roleSlug || 'employee';

  // If no email was passed via state (e.g. direct visit), redirect to default login
  if (!email) {
    return <Navigate to={`/login/${roleSlug}`} replace />;
  }

  return (
    <main
      id='main-content'
      className='min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 selection:bg-[#714B67] selection:text-white'
    >
      <OTPForm email={email} roleSlug={roleSlug} />
    </main>
  );
}
