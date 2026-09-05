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
    registerEmployee
} from '../controllers/auth.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============

// Login
router.post('/login', login);

// Verify Login OTP
router.post('/verify-login-otp', verifyLoginOTP);

// Resend Login OTP
router.post('/resend-login-otp', resendLoginOTP);

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password
router.post('/reset-password', resetPassword);

// Refresh Token
router.post('/refresh-token', refreshToken);

// ============ PROTECTED ROUTES ============

// Register User (Admin only)
router.post(
    '/register',
    protect,
    requirePermission('users', 'manage'),
    register
);

// Register Employee with User (Admin only)
router.post(
    '/register-employee',
    protect,
    requirePermission('users', 'manage'),
    registerEmployee
);

// Get Current User
router.get('/me', protect, getMe);

// Change Password
router.post('/change-password', protect, changePassword);

// Logout
router.post('/logout', protect, logout);

export default router;