import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import authApi from '../../services/authApi.js';
import { updateUser, logout } from '../../redux/slices/authSlice.js';

/**
 * AuthSessionProvider ensures that on application mount/reload,
 * if an access token exists, the user's profile and roles are authoritatively
 * hydrated from GET /auth/me.
 *
 * If the session is invalid or expired and token refresh fails, the auth state
 * is cleared cleanly.
 */
export default function AuthSessionProvider({ children }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const storedToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const [isInitializing, setIsInitializing] = useState(Boolean(storedToken));

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      if (!storedToken) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted && response?.user) {
          dispatch(
            updateUser({
              user: response.user,
              roles: response.user.roles,
            })
          );
        }
      } catch (err) {
        console.warn('Session hydration failed:', err.message);
        // If 401 or token is invalid, clear state
        if (err.response?.status === 401) {
          if (isMounted) {
            dispatch(logout());
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, storedToken]);

  if (isInitializing) {
    return (
      <div className='min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4'>
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-sm p-6 max-w-xs w-full flex flex-col items-center text-center space-y-3'>
          <div className='w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1'>
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
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <svg
              className='animate-spin h-3.5 w-3.5 text-[#714B67]'
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
            <span>Restoring session...</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
