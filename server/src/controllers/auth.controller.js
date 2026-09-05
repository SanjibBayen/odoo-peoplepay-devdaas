import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import Employee from '../models/employee.model.js';
import {
  generateToken,
  generateRefreshToken,
  createSession,
  destroySession,
  blacklistToken,
} from '../utils/token.utils.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sendEmail, sendEmailAsync } from '../utils/sendEmail.js';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '../utils/password.utils.js';
import { createOTP, verifyOTP, checkOTPRateLimit } from '../utils/otp.utils.js';
import {
  welcomeEmailTemplate,
  passwordResetSuccessTemplate,
  passwordChangeTemplate,
} from '../utils/emailTemplates.js';
import redis from '../config/redis.config.js';
import { sequelize } from '../config/database.js';

// ============ LOGIN ============

/**
 * @desc    Login - Step 1: Verify credentials + Send OTP
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Find user with password
  const user = await User.scope('withPassword').findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact HR', 403);
  }

  // Check if account is locked
  const lockKey = `lock:${user.id}`;
  const lockData = await redis.get(lockKey);

  if (lockData) {
    const lockInfo = JSON.parse(lockData);
    if (new Date(lockInfo.until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(lockInfo.until) - new Date()) / 60000);
      throw new AppError(`Account locked. Try again in ${remainingMinutes} minutes`, 423);
    }
  }

  // Verify password
  const isPasswordMatch = await comparePassword(password, user.passwordHash);

  if (!isPasswordMatch) {
    // Track failed attempts
    const attemptsKey = `login_attempts:${user.id}`;
    const attempts = parseInt((await redis.get(attemptsKey)) || '0') + 1;

    // Set attempts with 15 minute expiry
    await redis.set(attemptsKey, attempts, 'EX', 900);

    // Lock account after 5 failed attempts
    if (attempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await redis.set(
        lockKey,
        JSON.stringify({
          attempts,
          until: lockUntil.toISOString(),
        }),
        'EX',
        900
      );

      await redis.del(attemptsKey);

      throw new AppError('Account locked for 15 minutes due to too many failed attempts', 423);
    }

    throw new AppError(`Invalid credentials. ${5 - attempts} attempts remaining`, 401);
  }

  // Clear failed attempts on success
  await redis.del(`login_attempts:${user.id}`);
  await redis.del(lockKey);

  // Check rate limit for OTP
  await checkOTPRateLimit(normalizedEmail, 'login');

  // Generate and send OTP
  await createOTP(normalizedEmail, 'login');

  res.status(200).json({
    success: true,
    message: 'Password verified. OTP sent to your email',
    requiresOTP: true,
    email: normalizedEmail,
  });
});

// ============ VERIFY LOGIN OTP ============

/**
 * @desc    Verify login OTP - Complete login
 * @route   POST /api/auth/verify-login-otp
 * @access  Public
 */
export const verifyLoginOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Please provide email and OTP', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP
  await verifyOTP(normalizedEmail, otp, 'login');

  // Find user
  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ hooks: false });

  // Generate tokens
  const token = generateToken(user.id, 0);
  const refreshToken = generateRefreshToken(user.id, 0);

  // Create session (single session)
  await createSession(user.id, token, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Get user roles
  const roles = await user.getRoles({
    attributes: ['id', 'name', 'code'],
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      roles: roles.map((r) => r.code),
      lastLoginAt: user.lastLoginAt,
    },
  });
});

// ============ REGISTER USER (Admin Only) ============

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Private (Admin/HR)
 */
export const register = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, roleCodes } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw new AppError('Please provide email, password, firstName, and lastName', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  // Validate password strength
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const userExists = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (userExists) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    email: normalizedEmail,
    passwordHash: hashedPassword,
    firstName,
    lastName,
    isActive: true,
  });

  // Assign roles
  if (roleCodes && roleCodes.length > 0) {
    const roles = await Role.findAll({
      where: { code: roleCodes },
    });

    if (roles.length > 0) {
      await user.setRoles(roles);
    }
  } else {
    // Default role: EMPLOYEE
    const employeeRole = await Role.findOne({
      where: { code: 'EMPLOYEE' },
    });

    if (employeeRole) {
      await user.addRole(employeeRole);
    }
  }

  // Send welcome email
  sendEmailAsync({
    email: user.email,
    subject: 'Welcome to PeoplePay',
    html: welcomeEmailTemplate(user),
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      roles: roleCodes || ['EMPLOYEE'],
    },
  });
});

// ============ REGISTER EMPLOYEE ============

/**
 * @desc    Register employee with user account
 * @route   POST /api/auth/register-employee
 * @access  Private (Admin/HR)
 */
export const registerEmployee = asyncHandler(async (req, res, next) => {
  const {
    email,
    password,
    firstName,
    lastName,
    employeeCode,
    departmentId,
    jobPositionId,
    employeeTypeId,
    joiningDate,
    phone,
    roleCodes = ['EMPLOYEE'],
  } = req.body;

  if (!email || !password || !firstName || !lastName || !employeeCode || !joiningDate) {
    throw new AppError(
      'Please provide email, password, firstName, lastName, employeeCode, and joiningDate',
      400
    );
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  // Validate password
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const userExists = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (userExists) {
    throw new AppError('User with this email already exists', 400);
  }

  // Check if employee code exists
  const employeeExists = await Employee.findOne({
    where: { employeeCode },
  });

  if (employeeExists) {
    throw new AppError('Employee with this code already exists', 400);
  }

  // Use transaction
  const transaction = await sequelize.transaction();

  try {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create(
      {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        isActive: true,
      },
      { transaction }
    );

    // Assign roles
    if (roleCodes && roleCodes.length > 0) {
      const roles = await Role.findAll({
        where: { code: roleCodes },
      });

      if (roles.length > 0) {
        await user.setRoles(roles, { transaction });
      }
    }

    // Create employee
    const employee = await Employee.create(
      {
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        email: normalizedEmail,
        phone: phone || null,
        joiningDate,
        departmentId: departmentId || null,
        jobPositionId: jobPositionId || null,
        employeeTypeId: employeeTypeId || null,
        status: 'ACTIVE',
      },
      { transaction }
    );

    await transaction.commit();

    // Send welcome email
    sendEmailAsync({
      email: user.email,
      subject: 'Welcome to PeoplePay360',
      html: welcomeEmailTemplate({
        ...user.toJSON(),
        employeeCode,
      }),
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        roles: roleCodes,
      },
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// ============ LOGOUT ============

/**
 * @desc    Logout - Destroy session and blacklist token
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const token = req.token;

  // Destroy session
  await destroySession(userId);

  // Blacklist current token
  if (token) {
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(token, ttl);
  }

  // Clear refresh token cookie
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ============ REFRESH TOKEN ============

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('No refresh token provided', 401);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if blacklisted
    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    // Blacklist old refresh token (rotation)
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(refreshToken, ttl);

    // Generate new tokens
    const newToken = generateToken(user.id, 0);
    const newRefreshToken = generateRefreshToken(user.id, 0);

    // Create new session
    await createSession(user.id, newToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Set new refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

// ============ CHANGE PASSWORD ============

/**
 * @desc    Change password (logged-in user)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  // Get user with password
  const user = await User.scope('withPassword').findByPk(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  user.passwordHash = hashedPassword;
  await user.save();

  // Destroy all sessions (force re-login)
  await destroySession(user.id);

  // Send notification email
  sendEmailAsync({
    email: user.email,
    subject: 'Password Changed Successfully - PeoplePay360',
    html: passwordChangeTemplate(user),
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again',
  });
});

// ============ FORGOT PASSWORD ============

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Don't reveal if user exists (security)
    res.status(200).json({
      success: true,
      message: 'If this email exists, a password reset OTP has been sent',
    });
    return;
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // Check rate limit
  await checkOTPRateLimit(normalizedEmail, 'password_reset');

  // Send OTP
  await createOTP(normalizedEmail, 'password_reset');

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email',
  });
});

// ============ RESET PASSWORD ============

/**
 * @desc    Verify OTP and reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new AppError('Please provide email, OTP, and new password', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  // Verify OTP
  await verifyOTP(normalizedEmail, otp, 'password_reset');

  // Find user
  const user = await User.scope('withPassword').findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  user.passwordHash = hashedPassword;
  await user.save();

  // Destroy all sessions
  await destroySession(user.id);

  // Send confirmation email
  sendEmailAsync({
    email: user.email,
    subject: 'Password Reset Successful - PeoplePay360',
    html: passwordResetSuccessTemplate(user),
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password',
  });
});

// ============ GET CURRENT USER ============

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { 
      exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] 
    },
    include: [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get permissions
  const permissions = await user.getAllPermissions();

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
      })),
      permissions: permissions.map((p) => `${p.module}:${p.action}`),
    },
  });
});
// ============ RESEND LOGIN OTP ============

/**
 * @desc    Resend login OTP
 * @route   POST /api/auth/resend-login-otp
 * @access  Public
 */
export const resendLoginOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  await checkOTPRateLimit(normalizedEmail, 'login');
  await createOTP(normalizedEmail, 'login');

  res.status(200).json({
    success: true,
    message: 'Login OTP resent to your email',
  });
});