import crypto from 'crypto';
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
  generateRandomPassword,
} from '../utils/password.utils.js';
import { createOTP, verifyOTP, checkOTPRateLimit } from '../utils/otp.utils.js';
import {
  welcomeEmailTemplate,
  passwordResetSuccessTemplate,
  passwordChangeTemplate,
  magicLinkWelcomeEmailTemplate,
} from '../utils/emailTemplates.js';
import redis from '../config/redis.config.js';
import { sequelize } from '../config/database.js';

// ============ LOGIN ============

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact HR', 403);
  }

  const lockKey = `lock:${user.id}`;
  const lockData = await redis.get(lockKey);

  if (lockData) {
    const lockInfo = JSON.parse(lockData);
    if (new Date(lockInfo.until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(lockInfo.until) - new Date()) / 60000);
      throw new AppError(`Account locked. Try again in ${remainingMinutes} minutes`, 423);
    }
  }

  const isPasswordMatch = await comparePassword(password, user.passwordHash);

  if (!isPasswordMatch) {
    const attemptsKey = `login_attempts:${user.id}`;
    const attempts = parseInt((await redis.get(attemptsKey)) || '0') + 1;

    await redis.set(attemptsKey, attempts, 'EX', 900);

    if (attempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await redis.set(
        lockKey,
        JSON.stringify({ attempts, until: lockUntil.toISOString() }),
        'EX',
        900
      );

      await redis.del(attemptsKey);
      throw new AppError('Account locked for 15 minutes due to too many failed attempts', 423);
    }

    throw new AppError(`Invalid credentials. ${5 - attempts} attempts remaining`, 401);
  }

  await redis.del(`login_attempts:${user.id}`);
  await redis.del(lockKey);

  await checkOTPRateLimit(normalizedEmail, 'login');
  await createOTP(normalizedEmail, 'login');

  res.status(200).json({
    success: true,
    message: 'Password verified. OTP sent to your email',
    requiresOTP: true,
    email: normalizedEmail,
  });
});

// ============ VERIFY LOGIN OTP ============

export const verifyLoginOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Please provide email and OTP', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  await verifyOTP(normalizedEmail, otp, 'login');

  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: [
          'id',
          'employeeCode',
          'firstName',
          'lastName',
          'email',
          'phone',
          'departmentId',
          'jobPositionId',
          'status',
        ],
      },
    ],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ hooks: false });

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await createSession(user.id, token, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            phone: user.employee.phone,
            departmentId: user.employee.departmentId,
            jobPositionId: user.employee.jobPositionId,
            status: user.employee.status,
          }
        : null,
    },
  });
});

// ============ REGISTER USER (Admin Only) - WITH MAGIC LINK ============

export const register = asyncHandler(async (req, res, next) => {
  const { email, firstName, lastName, roleCodes } = req.body;

  if (!email || !firstName || !lastName) {
    throw new AppError('Please provide email, firstName, and lastName', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (userExists) {
    throw new AppError('User with this email already exists', 400);
  }

  // Generate magic link token
  const plainToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user with random temp password
  const tempPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: hashedPassword,
    firstName,
    lastName,
    isActive: true,
    passwordResetToken: plainToken,
    passwordResetExpires: expiresAt,
  });

  // Assign roles
  if (roleCodes && roleCodes.length > 0) {
    const roles = await Role.findAll({ where: { code: roleCodes } });
    if (roles.length > 0) {
      await user.setRoles(roles);
    }
  } else {
    const employeeRole = await Role.findOne({ where: { code: 'EMPLOYEE' } });
    if (employeeRole) {
      await user.addRole(employeeRole);
    }
  }

  // Build magic link
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const magicLink = `${clientUrl}/set-password?token=${encodeURIComponent(plainToken)}`;

  // Send magic link email
  sendEmailAsync({
    email: user.email,
    subject: 'Set Your Password - PeoplePay',
    html: magicLinkWelcomeEmailTemplate(user, magicLink),
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully. Magic link sent to email',
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

// ============ REGISTER EMPLOYEE - WITH MAGIC LINK ============

export const registerEmployee = asyncHandler(async (req, res, next) => {
  const {
    email,
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

  if (!email || !firstName || !lastName || !employeeCode || !joiningDate) {
    throw new AppError(
      'Please provide email, firstName, lastName, employeeCode, and joiningDate',
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({ where: { email: normalizedEmail } });
  if (userExists) {
    throw new AppError('User with this email already exists', 400);
  }

  const employeeExists = await Employee.findOne({ where: { employeeCode } });
  if (employeeExists) {
    throw new AppError('Employee with this code already exists', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    // Generate magic link token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Random temp password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const user = await User.create(
      {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        isActive: true,
        passwordResetToken: plainToken,
        passwordResetExpires: expiresAt,
      },
      { transaction }
    );

    if (roleCodes && roleCodes.length > 0) {
      const roles = await Role.findAll({ where: { code: roleCodes } });
      if (roles.length > 0) {
        await user.setRoles(roles, { transaction });
      }
    }

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

    // Build magic link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const magicLink = `${clientUrl}/set-password?token=${encodeURIComponent(plainToken)}`;

    // Send magic link email
    sendEmailAsync({
      email: user.email,
      subject: 'Set Your Password - PeoplePay',
      html: magicLinkWelcomeEmailTemplate(
        { ...user.toJSON(), employeeCode },
        magicLink
      ),
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully. Magic link sent to email',
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

// ============ VERIFY MAGIC LINK ============

export const verifyMagicLink = asyncHandler(async (req, res, next) => {
  const token = req.body.token || req.query.token;

  if (!token) {
    throw new AppError('Please provide a magic link token', 400);
  }

  const user = await User.unscoped().findOne({
    where: { passwordResetToken: token },
  });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
    throw new AppError('Magic link is invalid or expired', 400);
  }

  res.status(200).json({
    success: true,
    valid: true,
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

// ============ SET PASSWORD VIA MAGIC LINK ============

export const setPasswordViaMagicLink = asyncHandler(async (req, res, next) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    throw new AppError('Please provide token, newPassword, and confirmPassword', 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  const user = await User.unscoped().findOne({
    where: { passwordResetToken: token },
  });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
    throw new AppError('Magic link is invalid or expired', 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password set successfully. You can now login',
  });
});

// ============ RESEND MAGIC LINK ============

export const resendMagicLink = asyncHandler(async (req, res, next) => {
  const { email, userId } = req.body;

  if (!email && !userId) {
    throw new AppError('Please provide an email or userId', 400);
  }

  const user = await User.unscoped().findOne({
    where: userId ? { id: userId } : { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // Generate new token
  const plainToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.passwordResetToken = plainToken;
  user.passwordResetExpires = expiresAt;
  await user.save({ hooks: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const magicLink = `${clientUrl}/set-password?token=${encodeURIComponent(plainToken)}`;

  sendEmailAsync({
    email: user.email,
    subject: 'Set Your Password - PeoplePay',
    html: magicLinkWelcomeEmailTemplate(user, magicLink),
  });

  res.status(200).json({
    success: true,
    message: 'Magic link sent successfully',
  });
});

// ============ LOGOUT ============

export const logout = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const token = req.token;

  await destroySession(userId);

  if (token) {
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(token, ttl);
  }

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

export const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('No refresh token provided', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(refreshToken, ttl);

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await createSession(user.id, newToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

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

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  const user = await User.unscoped().findByPk(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await destroySession(user.id);

  sendEmailAsync({
    email: user.email,
    subject: 'Password Changed Successfully - PeoplePay',
    html: passwordChangeTemplate(user),
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again',
  });
});

// ============ FORGOT PASSWORD ============

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    res.status(200).json({
      success: true,
      message: 'If this email exists, a password reset OTP has been sent',
    });
    return;
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  await checkOTPRateLimit(normalizedEmail, 'password_reset');
  await createOTP(normalizedEmail, 'password_reset');

  res.status(200).json({
    success: true,
    message: 'Password reset OTP sent to your email',
  });
});

// ============ RESET PASSWORD ============

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new AppError('Please provide email, OTP, and new password', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  await verifyOTP(normalizedEmail, otp, 'password_reset');

  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await destroySession(user.id);

  sendEmailAsync({
    email: user.email,
    subject: 'Password Reset Successful - PeoplePay',
    html: passwordResetSuccessTemplate(user),
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password',
  });
});

// ============ GET CURRENT USER ============

export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: {
      exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'],
    },
    include: [
      {
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'code'],
        through: { attributes: [] },
      },
      {
        model: Employee,
        as: 'employee',
        attributes: [
          'id',
          'employeeCode',
          'firstName',
          'lastName',
          'email',
          'phone',
          'departmentId',
          'jobPositionId',
          'status',
        ],
      },
    ],
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

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
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            email: user.employee.email,
            phone: user.employee.phone,
            departmentId: user.employee.departmentId,
            jobPositionId: user.employee.jobPositionId,
            status: user.employee.status,
          }
        : null,
      permissions: permissions.map((p) => `${p.module}:${p.action}`),
    },
  });
});

// ============ RESEND LOGIN OTP ============

export const resendLoginOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide email', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });

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