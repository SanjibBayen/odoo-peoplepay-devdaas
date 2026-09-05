/**
 * Automated Verification Script for PeoplePay Authentication Integration
 *
 * Validates:
 * 1. apiClient configuration (withCredentials: true, baseURL)
 * 2. authApi service methods (no mock fallbacks, all backend endpoints present)
 * 3. Redux authSlice (actions, state shape, mapBackendRole mappings)
 * 4. Route definitions (OTP verification route registered)
 * 5. Component exports and contracts (LoginForm, OTPForm, ChangePasswordModal, AuthSessionProvider)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_ROOT = path.resolve(__dirname, '..');

console.log('--- PEOPLEPAY AUTH INTEGRATION VERIFICATION ---');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`FAIL: ${description}`);
    console.error(`      ${err.message}`);
  }
}

// 1. apiClient Configuration
test('apiClient has withCredentials: true and baseURL configured', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/services/apiClient.js'),
    'utf-8'
  );
  assert.ok(
    fileContent.includes('withCredentials: true'),
    'apiClient must have withCredentials: true'
  );
  assert.ok(
    fileContent.includes('/auth/refresh-token'),
    'apiClient must have refresh token endpoint configured in 401 interceptor'
  );
  assert.ok(
    fileContent.includes('isRefreshing'),
    'apiClient must have refresh queue/lock mechanism'
  );
});

// 2. authApi Service
test('authApi exports all required endpoints with no mock fallbacks', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/services/authApi.js'),
    'utf-8'
  );

  const requiredMethods = [
    'login',
    'verifyLoginOTP',
    'resendLoginOTP',
    'forgotPassword',
    'resetPassword',
    'refreshToken',
    'getMe',
    'getCurrentUser',
    'changePassword',
    'logout',
    'register',
    'registerEmployee',
  ];

  for (const method of requiredMethods) {
    const hasMethod =
      fileContent.includes(`${method}(`) ||
      fileContent.includes(`async ${method}(`) ||
      fileContent.includes(`${method}:`);
    assert.ok(hasMethod, `authApi must define ${method}`);
  }

  // Ensure no mock fallbacks
  assert.ok(
    !fileContent.includes('mockUsers'),
    'authApi must not contain mockUsers'
  );
  assert.ok(
    !fileContent.includes('role.demoEmail'),
    'authApi must not use demo email mock matching'
  );
});

// 3. Redux authSlice & Role Normalization
test('authSlice includes role normalizer and required actions', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/redux/slices/authSlice.js'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('mapBackendRole'),
    'authSlice must define mapBackendRole'
  );
  assert.ok(
    fileContent.includes('updateUser'),
    'authSlice must export updateUser action'
  );
  assert.ok(
    fileContent.includes('setCredentials'),
    'authSlice must export setCredentials action'
  );
  assert.ok(
    fileContent.includes('logout'),
    'authSlice must export logout action'
  );

  // Check role mappings
  const roles = [
    'ADMIN',
    'HR_PAYROLL_MANAGER',
    'HR_PAYROLL_USER',
    'HR_MANAGER',
    'EMPLOYEE',
  ];
  for (const r of roles) {
    assert.ok(
      fileContent.includes(`'${r}'`),
      `authSlice mapBackendRole must handle backend code ${r}`
    );
  }
});

// 4. Component Verification
test('LoginForm triggers OTP navigation and handles forgot password', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/components/auth/LoginForm.jsx'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('/login/verify-otp'),
    'LoginForm must navigate to /login/verify-otp when OTP is required'
  );
  assert.ok(
    fileContent.includes('authApi.forgotPassword'),
    'LoginForm must connect to authApi.forgotPassword'
  );
  assert.ok(
    fileContent.includes('authApi.resetPassword'),
    'LoginForm must connect to authApi.resetPassword'
  );
  assert.ok(
    fileContent.includes('Signing in...'),
    'LoginForm must show Signing in... during submit'
  );
});

test('OTPForm and LoginOTPPage exist and handle 6-digit verification', () => {
  const formContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/components/auth/OTPForm.jsx'),
    'utf-8'
  );
  const pageContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/pages/auth/LoginOTPPage.jsx'),
    'utf-8'
  );

  assert.ok(
    formContent.includes('authApi.verifyLoginOTP'),
    'OTPForm must call authApi.verifyLoginOTP'
  );
  assert.ok(
    formContent.includes('authApi.resendLoginOTP'),
    'OTPForm must call authApi.resendLoginOTP'
  );
  assert.ok(
    pageContent.includes('<OTPForm'),
    'LoginOTPPage must render OTPForm'
  );
});

test('ChangePasswordModal exists and connects to authApi.changePassword', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/components/auth/ChangePasswordModal.jsx'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('authApi.changePassword'),
    'ChangePasswordModal must call authApi.changePassword'
  );
  assert.ok(
    fileContent.includes('currentPassword'),
    'ChangePasswordModal must accept currentPassword'
  );
  assert.ok(
    fileContent.includes('newPassword'),
    'ChangePasswordModal must accept newPassword'
  );
});

test('AuthSessionProvider hydrates session on load via authApi.getMe()', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/components/auth/AuthSessionProvider.jsx'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('authApi.getMe()'),
    'AuthSessionProvider must call authApi.getMe()'
  );
  assert.ok(
    fileContent.includes('updateUser'),
    'AuthSessionProvider must dispatch updateUser'
  );
  assert.ok(
    fileContent.includes('Restoring session...'),
    'AuthSessionProvider must show Restoring session... splash'
  );
});

test('AppRoutes registers /login/verify-otp and wraps with AuthSessionProvider', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/routes/AppRoutes.jsx'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('/login/verify-otp'),
    'AppRoutes must register /login/verify-otp'
  );
  assert.ok(
    fileContent.includes('<AuthSessionProvider>'),
    'AppRoutes must wrap routes in <AuthSessionProvider>'
  );
});

test('useLogout clears session across backend, Redux, and storage', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/hooks/useLogout.js'),
    'utf-8'
  );
  const authSliceContent = fs.readFileSync(
    path.join(CLIENT_ROOT, 'src/redux/slices/authSlice.js'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('authApi.logout'),
    'useLogout must call authApi.logout()'
  );
  assert.ok(
    fileContent.includes('dispatch(logout())'),
    'useLogout must dispatch Redux logout action'
  );
  assert.ok(
    authSliceContent.includes('localStorage.removeItem'),
    'authSlice logout action must clear localStorage token and user'
  );
});

test('Docs api-contract.md reflects real backend auth contract', () => {
  const fileContent = fs.readFileSync(
    path.join(CLIENT_ROOT, '..', 'docs/api-contract.md'),
    'utf-8'
  );

  assert.ok(
    fileContent.includes('/auth/verify-login-otp'),
    'api-contract.md must document /auth/verify-login-otp'
  );
  assert.ok(
    fileContent.includes('/auth/refresh-token'),
    'api-contract.md must document /auth/refresh-token'
  );
  assert.ok(
    fileContent.includes('withCredentials: true'),
    'api-contract.md must document withCredentials requirement'
  );
});

console.log('-----------------------------------------------');
console.log(`Verification Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
