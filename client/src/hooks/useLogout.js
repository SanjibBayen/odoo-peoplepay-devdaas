import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice.js';
import { selectCurrentRole } from '../redux/selectors/authSelectors.js';
import authApi from '../services/authApi.js';

/**
 * Custom hook providing robust, secure logout functionality.
 * Contacts backend POST /auth/logout, clears Redux auth state and storage,
 * and navigates to the appropriate login page.
 */
export function useLogout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentRole = useSelector(selectCurrentRole) || 'employee';

  const handleLogout = async (customRoleSlug) => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout warning', err);
    } finally {
      dispatch(logout());
      const roleSlug = (customRoleSlug || currentRole).replace('_', '-');
      navigate(`/login/${roleSlug}`, { replace: true });
    }
  };

  return handleLogout;
}

export default useLogout;
