import apiClient from './apiClient.js';

/**
 * Authentication API Service
 * Source of truth: server/src/routes/auth.routes.js & server/src/controllers/auth.controller.js
 */
export const authApi = {
  /**
   * Step 1: Verify credentials and trigger 2FA OTP
   * POST /auth/login
   * @param {string|Object} emailOrData - email string or { email, password }
   * @param {string} [maybePassword] - password string
   * @returns {Promise<Object>} - { success, message, requiresOTP, email }
   */
  async login(emailOrData, maybePassword) {
    const payload =
      typeof emailOrData === 'object' && emailOrData !== null
        ? {
            email: emailOrData.email?.trim().toLowerCase(),
            password: emailOrData.password,
          }
        : {
            email: typeof emailOrData === 'string' ? emailOrData.trim().toLowerCase() : '',
            password: maybePassword,
          };

    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  /**
   * Step 2: Verify login OTP and complete authentication
   * POST /auth/verify-login-otp
   * @param {string|Object} emailOrData - email string or { email, otp }
   * @param {string} [maybeOtp] - 6-digit OTP string
   * @returns {Promise<Object>} - { success, message, token, user }
   */
  async verifyLoginOTP(emailOrData, maybeOtp) {
    const payload =
      typeof emailOrData === 'object' && emailOrData !== null
        ? {
            email: emailOrData.email?.trim().toLowerCase(),
            otp: String(emailOrData.otp).trim(),
          }
        : {
            email: typeof emailOrData === 'string' ? emailOrData.trim().toLowerCase() : '',
            otp: String(maybeOtp).trim(),
          };

    const response = await apiClient.post('/auth/verify-login-otp', payload);
    return response.data;
  },

  /**
   * Resend login OTP to email
   * POST /auth/resend-login-otp
   * @param {string|Object} emailOrData - email string or { email }
   * @returns {Promise<Object>} - { success, message }
   */
  async resendLoginOTP(emailOrData) {
    const email =
      typeof emailOrData === 'object' && emailOrData !== null
        ? emailOrData.email?.trim().toLowerCase()
        : String(emailOrData || '').trim().toLowerCase();

    const response = await apiClient.post('/auth/resend-login-otp', { email });
    return response.data;
  },

  /**
   * Trigger password reset OTP
   * POST /auth/forgot-password
   * @param {string|Object} emailOrData - email string or { email }
   * @returns {Promise<Object>} - { success, message }
   */
  async forgotPassword(emailOrData) {
    const email =
      typeof emailOrData === 'object' && emailOrData !== null
        ? emailOrData.email?.trim().toLowerCase()
        : String(emailOrData || '').trim().toLowerCase();

    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with OTP
   * POST /auth/reset-password
   * @param {string|Object} emailOrData - email string or { email, otp, newPassword }
   * @param {string} [maybeOtp] - 6-digit OTP string
   * @param {string} [maybeNewPassword] - new password string
   * @returns {Promise<Object>} - { success, message }
   */
  async resetPassword(emailOrData, maybeOtp, maybeNewPassword) {
    const payload =
      typeof emailOrData === 'object' && emailOrData !== null
        ? {
            email: emailOrData.email?.trim().toLowerCase(),
            otp: String(emailOrData.otp).trim(),
            newPassword: emailOrData.newPassword,
          }
        : {
            email: typeof emailOrData === 'string' ? emailOrData.trim().toLowerCase() : '',
            otp: String(maybeOtp).trim(),
            newPassword: maybeNewPassword,
          };

    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },

  /**
   * Refresh access token via HTTP-only refreshToken cookie
   * POST /auth/refresh-token
   * @returns {Promise<Object>} - { success, token }
   */
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  },

  /**
   * Retrieve current authenticated user profile and permissions
   * GET /auth/me
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
   * POST /auth/change-password
   * @param {string|Object} currentPasswordOrData - currentPassword string or { currentPassword, newPassword }
   * @param {string} [maybeNewPassword] - new password string
   * @returns {Promise<Object>} - { success, message }
   */
  async changePassword(currentPasswordOrData, maybeNewPassword) {
    const payload =
      typeof currentPasswordOrData === 'object' && currentPasswordOrData !== null
        ? {
            currentPassword: currentPasswordOrData.currentPassword,
            newPassword: currentPasswordOrData.newPassword,
          }
        : {
            currentPassword: currentPasswordOrData,
            newPassword: maybeNewPassword,
          };

    const response = await apiClient.post('/auth/change-password', payload);
    return response.data;
  },

  /**
   * Invalidate session and logout
   * POST /auth/logout
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
   * Register new user (Admin only - NO PASSWORD, magic link sent)
   * POST /auth/register
   * @param {Object} data - { email, firstName, lastName, roleCodes }
   */
  async register(data) {
    const { password: _p, ...cleanData } = data || {};
    if (cleanData.email) {
      cleanData.email = cleanData.email.trim().toLowerCase();
    }
    const response = await apiClient.post('/auth/register', cleanData);
    return response.data;
  },

  /**
   * Register employee with user (Admin/HR - NO PASSWORD, magic link sent)
   * POST /auth/register-employee
   * @param {Object} data - { email, firstName, lastName, employeeCode, departmentId, jobPositionId, employeeTypeId, joiningDate, phone, roleCodes }
   */
  async registerEmployee(data) {
    const { password: _p, ...cleanData } = data || {};
    if (cleanData.email) {
      cleanData.email = cleanData.email.trim().toLowerCase();
    }
    const response = await apiClient.post('/auth/register-employee', cleanData);
    return response.data;
  },

  /**
   * Verify magic link token
   * POST /auth/verify-magic-link
   * @param {string|Object} tokenOrData - magic-link token string or { token }
   * @returns {Promise<Object>} - { success, valid, user: { email, firstName, lastName } }
   */
  async verifyMagicLink(tokenOrData) {
    const token =
      typeof tokenOrData === 'object' && tokenOrData !== null
        ? tokenOrData.token
        : tokenOrData;

    const response = await apiClient.post('/auth/verify-magic-link', { token });
    return response.data;
  },

  /**
   * Set password via magic link
   * POST /auth/set-password-magic-link
   * @param {string|Object} tokenOrData - token string or { token, newPassword, confirmPassword }
   * @param {string} [maybeNewPassword] - new password string
   * @returns {Promise<Object>} - { success, message }
   */
  async setPasswordViaMagicLink(tokenOrData, maybeNewPassword) {
    let payload;
    if (typeof tokenOrData === 'object' && tokenOrData !== null) {
      const pwd = tokenOrData.newPassword || tokenOrData.password;
      payload = {
        token: tokenOrData.token,
        newPassword: pwd,
        confirmPassword: tokenOrData.confirmPassword || pwd,
      };
    } else {
      payload = {
        token: tokenOrData,
        newPassword: maybeNewPassword,
        confirmPassword: maybeNewPassword,
      };
    }

    const response = await apiClient.post('/auth/set-password-magic-link', payload);
    return response.data;
  },

  /**
   * Resend magic link (Admin/HR)
   * POST /auth/resend-magic-link
   * @param {string|Object} emailOrData - email string or { email }
   * @returns {Promise<Object>} - { success, message }
   */
  async resendMagicLink(emailOrData) {
    const email =
      typeof emailOrData === 'object' && emailOrData !== null
        ? emailOrData.email?.trim().toLowerCase()
        : String(emailOrData || '').trim().toLowerCase();

    const response = await apiClient.post('/auth/resend-magic-link', { email });
    return response.data;
  },
};

export default authApi;
