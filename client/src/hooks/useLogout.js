import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice.js';
import authApi from '../services/authApi.js';
import socketService from '../services/socketService.js';

/**
 * Custom hook providing robust, secure logout functionality.
 * Contacts backend POST /auth/logout, clears Redux auth state and storage,
 * and navigates to the appropriate login page.
 */
export function useLogout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout warning', err);
    } finally {
      try {
        socketService.disconnect();
      } catch (sErr) {
        console.warn('Socket disconnect warning', sErr);
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('peoplepay_token');
          localStorage.removeItem('user');
          localStorage.removeItem('peoplepay_user');
          localStorage.removeItem('role');
          localStorage.removeItem('peoplepay_role');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('peoplepay_token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('peoplepay_user');
          sessionStorage.removeItem('role');
          sessionStorage.removeItem('peoplepay_role');
        } catch {
          // ignore
        }
      }
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };

  return handleLogout;
}

export default useLogout;
