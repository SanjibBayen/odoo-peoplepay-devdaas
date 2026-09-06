import { createSlice } from '@reduxjs/toolkit';

/**
 * Maps backend roles (code strings or role objects) to frontend normalized role identifiers.
 * Respects administrative role hierarchy: admin > hr_payroll_manager > hr_payroll_user > hr_manager > employee
 */
export function mapBackendRole(rolesOrUser) {
  if (!rolesOrUser) return 'employee';

  let rawList = [];
  if (Array.isArray(rolesOrUser)) {
    rawList = rolesOrUser;
  } else if (typeof rolesOrUser === 'string') {
    rawList = [rolesOrUser];
  } else if (typeof rolesOrUser === 'object') {
    if (Array.isArray(rolesOrUser.roles)) {
      rawList = rolesOrUser.roles;
    } else if (rolesOrUser.role) {
      rawList = [rolesOrUser.role];
    }
  }

  const codes = rawList
    .map((r) => {
      if (typeof r === 'string') return r.toUpperCase().replace(/-/g, '_');
      if (r && typeof r === 'object' && r.code) return r.code.toUpperCase().replace(/-/g, '_');
      return '';
    })
    .filter(Boolean);

  if (codes.includes('ADMIN')) return 'admin';
  if (codes.includes('HR_PAYROLL_MANAGER')) return 'hr_payroll_manager';
  if (codes.includes('HR_PAYROLL_USER')) return 'hr_payroll_user';
  if (codes.includes('HR_MANAGER')) return 'hr_manager';
  if (codes.includes('EMPLOYEE')) return 'employee';

  if (codes.length > 0) {
    return codes[0].toLowerCase();
  }
  return 'employee';
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('peoplepay_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('peoplepay_token') ||
    null
  );
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem('user') ||
      localStorage.getItem('peoplepay_user') ||
      sessionStorage.getItem('user') ||
      sessionStorage.getItem('peoplepay_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredRole() {
  if (typeof window === 'undefined') return null;
  const directRole =
    localStorage.getItem('role') ||
    localStorage.getItem('peoplepay_role') ||
    sessionStorage.getItem('role') ||
    sessionStorage.getItem('peoplepay_role');
  if (directRole) return mapBackendRole(directRole);
  const user = getStoredUser();
  return user ? mapBackendRole(user) : null;
}

const initialToken = getStoredToken();
const initialUser = getStoredUser();
const initialRole = getStoredRole();

const initialState = {
  user: initialUser,
  role: initialRole,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, role } = action.payload || {};
      const mappedRole = mapBackendRole(role || user);

      state.user = user || null;
      state.token = token || state.token || null;
      state.role = mappedRole;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('peoplepay_token', token);
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('peoplepay_token', token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('peoplepay_user', JSON.stringify(user));
          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('peoplepay_user', JSON.stringify(user));
        }
        if (mappedRole) {
          localStorage.setItem('role', mappedRole);
          localStorage.setItem('peoplepay_role', mappedRole);
          sessionStorage.setItem('role', mappedRole);
          sessionStorage.setItem('peoplepay_role', mappedRole);
        }
      }
    },
    updateUser: (state, action) => {
      const user = action.payload;
      if (!user) return;
      const mappedRole = mapBackendRole(user);

      state.user = { ...(state.user || {}), ...user };
      state.role = mappedRole;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(state.user));
        localStorage.setItem('peoplepay_user', JSON.stringify(state.user));
        sessionStorage.setItem('user', JSON.stringify(state.user));
        sessionStorage.setItem('peoplepay_user', JSON.stringify(state.user));
        localStorage.setItem('role', mappedRole);
        localStorage.setItem('peoplepay_role', mappedRole);
        sessionStorage.setItem('role', mappedRole);
        sessionStorage.setItem('peoplepay_role', mappedRole);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      if (typeof window !== 'undefined') {
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
      }
    },
    setLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload || null;
      state.loading = false;
    },
  },
});

export const {
  setCredentials,
  updateUser,
  logout,
  setLoading,
  setError,
} = authSlice.actions;

export default authSlice.reducer;
