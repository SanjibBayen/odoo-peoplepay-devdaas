import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectCurrentRole,
  selectCurrentToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../redux/selectors/authSelectors.js';
import { useLogout } from './useLogout.js';

/**
 * Custom hook providing centralized access to authentication state,
 * role verification helpers, and session termination.
 */
export function useAuth() {
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectCurrentRole);
  const token = useSelector(selectCurrentToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const logout = useLogout();

  const normalizedRole = (role || '').toLowerCase();

  const permissions = user?.permissions || [];

  const hasPermission = (module, action) => {
    if (normalizedRole === 'admin') return true;
    return permissions.includes(`${module}:${action}`);
  };

  return {
    user,
    role,
    token,
    permissions,
    hasPermission,
    isAuthenticated,
    loading,
    error,
    logout,
    isAdmin: normalizedRole === 'admin',
    isHRManager: normalizedRole === 'hr_manager',
    isHRPayrollManager: normalizedRole === 'hr_payroll_manager',
    isHRPayrollUser: normalizedRole === 'hr_payroll_user',
    isEmployee: normalizedRole === 'employee',
  };
}

export default useAuth;
