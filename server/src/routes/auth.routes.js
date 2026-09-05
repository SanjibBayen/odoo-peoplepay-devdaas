import express from 'express';
import {
  login,
  verifyLoginOTP,
  resendLoginOTP,
  logout,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  register,
  registerEmployee,
  verifyMagicLink,
  setPasswordViaMagicLink,
  resendMagicLink,
} from '../controllers/auth.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

// Login (2FA)
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-login-otp', resendLoginOTP);

// Forgot/Reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Refresh Token
router.post('/refresh-token', refreshToken);

// Magic Link Routes
router.post('/verify-magic-link', verifyMagicLink);
router.post('/set-password-magic-link', setPasswordViaMagicLink);

// ============ PROTECTED ROUTES ============

// Register User (Admin only)
router.post(
  '/register',
  protect,
  requirePermission('users', 'manage'),
  register
);

// Register Employee (Admin only)
router.post(
  '/register-employee',
  protect,
  requirePermission('users', 'manage'),
  registerEmployee
);

// Resend Magic Link (Admin/HR)
router.post(
  '/resend-magic-link',
  protect,
  requirePermission('users', 'manage'),
  resendMagicLink
);

// Get Current User
router.get('/me', protect, getMe);

// Change Password
router.post('/change-password', protect, changePassword);

// Logout
router.post('/logout', protect, logout);

export default router;