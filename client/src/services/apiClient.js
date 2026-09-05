import axios from 'axios';
import store from '../redux/store/store.js';
import { logout, setCredentials } from '../redux/slices/authSlice.js';

const baseURL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Request Interceptor: Attach JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const state = store.getState();
      const token =
        state.auth?.token ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem('peoplepay_token') ||
            sessionStorage.getItem('peoplepay_token')));

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to attach auth header', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 with Token Refresh and Prevent Loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isRedirectingToLogin = false;

const redirectToLogin = () => {
  store.dispatch(logout());
  if (typeof window !== 'undefined' && !isRedirectingToLogin) {
    const pathname = window.location.pathname;
    if (!pathname.startsWith('/login') && pathname !== '/') {
      isRedirectingToLogin = true;
      const role =
        localStorage.getItem('peoplepay_role') ||
        sessionStorage.getItem('peoplepay_role') ||
        'employee';
      const roleSlug = role.replace('_', '-');
      window.location.href = `/login/${roleSlug}`;
      setTimeout(() => {
        isRedirectingToLogin = false;
      }, 3000);
    }
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || '';
      // Don't attempt refresh for authentication endpoints
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/verify-login-otp') ||
        url.includes('/auth/refresh-token')
      ) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data?.token;
        if (newToken) {
          const state = store.getState();
          store.dispatch(
            setCredentials({
              user: state.auth.user,
              role: state.auth.role,
              token: newToken,
            })
          );

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No token returned from refresh');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        redirectToLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
