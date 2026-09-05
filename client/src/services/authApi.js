import apiClient from './apiClient.js';

/**
 * Authentication API Service
 * Source of truth: server/src/routes/auth.routes.js & server/src/controllers/auth.controller.js
 */
export const authApi = {
  /**
   * Step 1: Verify credentials and trigger 2FA OTP
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>} - { success, message, requiresOTP, email }
   */
  async login({ email, password }) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Step 2: Verify login OTP and complete authentication
   * @param {Object} data - { email, otp }
   * @returns {Promise<Object>} - { success, token, user }
   */
  async verifyLoginOTP({ email, otp }) {
    const response = await apiClient.post('/auth/verify-login-otp', {
      email,
      otp,
    });
    return response.data;
  },

  /**
   * Resend login OTP to email
   * @param {Object} data - { email }
   * @returns {Promise<Object>} - { success, message }
   */
  async resendLoginOTP({ email }) {
    const response = await apiClient.post('/auth/resend-login-otp', {
      email,
    });
    return response.data;
  },

  /**
   * Trigger password reset OTP
   * @param {Object} data - { email }
   * @returns {Promise<Object>} - { success, message }
   */
  async forgotPassword({ email }) {
    const response = await apiClient.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  /**
   * Reset password with OTP
   * @param {Object} data - { email, otp, newPassword }
   * @returns {Promise<Object>} - { success, message }
   */
  async resetPassword({ email, otp, newPassword }) {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },

  /**
   * Refresh access token via HTTP-only refreshToken cookie
   * @returns {Promise<Object>} - { success, token }
   */
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  },

  /**
   * Retrieve current authenticated user profile and permissions
   * @returns {Promise<Object>} - { success, user: { id, email, fullName, roles, permissions } }
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Alias for getMe for backward compatibility
   */
  async getCurrentUser() {
    return this.getMe();
  },

  /**
   * Change password for logged-in user
   * @param {Object} data - { currentPassword, newPassword }
   * @returns {Promise<Object>} - { success, message }
   */
  async changePassword({ currentPassword, newPassword }) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Invalidate session and logout
   * @returns {Promise<Object>} - { success, message }
   */
  async logout() {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (e) {
      console.warn('Backend logout failed or was already cleared', e.message);
      return { success: true };
    }
  },

  /**
   * Register new user (Admin only)
   * @param {Object} data - { email, password, firstName, lastName, roleCodes }
   */
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Register employee with user (Admin only)
   * @param {Object} data - { email, password, firstName, lastName, employeeCode, departmentId, jobPositionId, employeeTypeId, joiningDate, phone, roleCodes }
   */
  async registerEmployee(data) {
    const response = await apiClient.post('/auth/register-employee', data);
    return response.data;
  },

  /**
   * Verify magic link token
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async verifyMagicLink(token) {
    const response = await apiClient.post('/auth/verify-magic-link', { token });
    return response.data;
  },

  /**
   * Set password via magic link
   * @param {Object} data - { token, newPassword, password, confirmPassword }
   * @returns {Promise<Object>}
   */
  async setPasswordViaMagicLink({ token, newPassword, password, confirmPassword }) {
    const pwd = newPassword || password;
    const response = await apiClient.post('/auth/set-password-magic-link', {
      token,
      newPassword: pwd,
      confirmPassword: confirmPassword || pwd,
    });
    return response.data;
  },

  /**
   * Resend magic link (Admin/HR)
   * @param {Object} data - { email }
   * @returns {Promise<Object>}
   */
  async resendMagicLink({ email }) {
    const response = await apiClient.post('/auth/resend-magic-link', { email });
    return response.data;
  },
};

export default authApi;
