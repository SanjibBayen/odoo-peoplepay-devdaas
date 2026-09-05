import redis from '../config/redis.config.js';
import crypto from 'crypto';
import { sendEmail } from './sendEmail.js';
import { otpEmailTemplate } from './emailTemplates.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Generate 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  // Cryptographically secure OTP generation
  const buffer = crypto.randomBytes(4);
  const otp = (buffer.readUInt32BE(0) % 900000 + 100000).toString();
  return otp;
};

/**
 * Generate alphanumeric OTP (for higher security)
 * @param {number} length - OTP length
 * @returns {string} Alphanumeric OTP
 */
export const generateAlphanumericOTP = (length = 6) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(charset.length);
    otp += charset[randomIndex];
  }
  
  return otp;
};

/**
 * Hash OTP using HMAC-SHA256 (faster than bcrypt for OTPs)
 * @param {string} otp - Plain OTP
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {string} Hashed OTP
 */
export const hashOTP = (otp, email, purpose) => {
  const secret = process.env.OTP_SECRET || 'peoplepay360-otp-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${otp}:${email}:${purpose}`)
    .digest('hex');
};

/**
 * Verify OTP against hash
 * @param {string} otp - Plain OTP
 * @param {string} hashedOTP - Hashed OTP
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {boolean} True if OTP matches
 */
export const verifyOTPHash = (otp, hashedOTP, email, purpose) => {
  const calculatedHash = hashOTP(otp, email, purpose);
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash),
    Buffer.from(hashedOTP)
  );
};

/**
 * Create and store OTP in Redis
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose (login, registration, password_reset)
 * @returns {Promise<string>} Generated OTP (to send via email)
 */
export const createOTP = async (email, purpose) => {
  const otp = generateOTP();
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  
  // Hash OTP before storing
  const hashedOTP = hashOTP(otp, email.toLowerCase(), purpose);
  
  // Store hashed OTP with 5 minutes expiry
  await redis.set(key, hashedOTP, 'EX', 300);
  
  // Initialize attempts counter
  await redis.set(`${key}:attempts`, 0, 'EX', 300);
  
  // Initialize resend cooldown
  await redis.set(`${key}:cooldown`, 1, 'EX', 60); // 1 minute cooldown
  
  // Send email with OTP
  try {
    await sendEmail({
      email,
      subject: getOTPSubject(purpose),
      html: otpEmailTemplate(otp, purpose)
    });
  } catch (error) {
    console.error('OTP email sending failed:', error.message);
    // Don't throw - OTP is still created, user can resend
  }
  
  return otp;
};

/**
 * Get subject based on purpose
 * @param {string} purpose - OTP purpose
 * @returns {string} Email subject
 */
const getOTPSubject = (purpose) => {
  const subjects = {
    registration: 'Your Registration OTP - PeoplePay360',
    login: 'Your Login OTP - PeoplePay360',
    password_reset: 'Your Password Reset OTP - PeoplePay360',
    email_verification: 'Email Verification OTP - PeoplePay360',
    payroll_validation: 'Payroll Validation OTP - PeoplePay360',
    sensitive_action: 'Security Verification OTP - PeoplePay360'
  };
  return subjects[purpose] || 'Your OTP Code - PeoplePay360';
};

/**
 * Verify OTP from Redis
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @param {string} purpose - OTP purpose
 * @returns {Promise<boolean>} True if OTP is valid
 */
export const verifyOTP = async (email, otp, purpose) => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  
  // Get stored hashed OTP
  const storedHashedOTP = await redis.get(key);
  
  if (!storedHashedOTP) {
    throw new AppError('OTP has expired. Please request a new OTP', 400);
  }
  
  // Check attempts
  const attempts = parseInt(await redis.get(`${key}:attempts`) || '0');
  
  if (attempts >= 5) {
    await redis.del(key);
    await redis.del(`${key}:attempts`);
    throw new AppError('Too many invalid attempts. Please request a new OTP', 400);
  }
  
  // Verify OTP against hash
  const isOTPValid = verifyOTPHash(otp, storedHashedOTP, email.toLowerCase(), purpose);
  
  if (!isOTPValid) {
    await redis.incr(`${key}:attempts`);
    const remainingAttempts = 5 - (attempts + 1);
    throw new AppError(`Invalid OTP. ${remainingAttempts} attempts remaining`, 400);
  }
  
  // Delete OTP after success
  await redis.del(key);
  await redis.del(`${key}:attempts`);
  await redis.del(`${key}:cooldown`);
  
  return true;
};

/**
 * Check OTP rate limit
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<boolean>} True if not rate limited
 */
export const checkOTPRateLimit = async (email, purpose) => {
  const key = `otp:ratelimit:${purpose}:${email.toLowerCase()}`;
  
  // Get current count
  const count = await redis.get(key);
  
  // Check if rate limited
  if (count && parseInt(count) >= 3) {
    const ttl = await redis.ttl(key);
    throw new AppError(
      `Too many OTP requests. Please try again in ${Math.ceil(ttl / 60)} minutes`,
      429
    );
  }
  
  // Check cooldown
  const cooldownKey = `otp:${purpose}:${email.toLowerCase()}:cooldown`;
  const isInCooldown = await redis.get(cooldownKey);
  
  if (isInCooldown) {
    const ttl = await redis.ttl(cooldownKey);
    throw new AppError(
      `Please wait ${ttl} seconds before requesting another OTP`,
      429
    );
  }
  
  // Increment or set with TTL
  if (!count) {
    await redis.set(key, 1, 'EX', 900); // 15 minutes
  } else {
    await redis.incr(key);
    const ttl = await redis.ttl(key);
    if (ttl === -1) {
      await redis.expire(key, 900);
    }
  }
  
  return true;
};

/**
 * Resend OTP with cooldown check
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<string>} New OTP
 */
export const resendOTP = async (email, purpose) => {
  // Check rate limit
  await checkOTPRateLimit(email, purpose);
  
  // Delete old OTP
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  await redis.del(key);
  await redis.del(`${key}:attempts`);
  
  // Create new OTP
  const otp = await createOTP(email, purpose);
  
  return otp;
};

/**
 * Get remaining OTP attempts
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<number>} Remaining attempts
 */
export const getRemainingAttempts = async (email, purpose) => {
  const key = `otp:${purpose}:${email.toLowerCase()}:attempts`;
  const attempts = parseInt(await redis.get(key) || '0');
  return Math.max(0, 5 - attempts);
};

/**
 * Delete OTP (for cleanup)
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<void>}
 */
export const deleteOTP = async (email, purpose) => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  await redis.del(key);
  await redis.del(`${key}:attempts`);
  await redis.del(`${key}:cooldown`);
};

/**
 * Check if OTP exists
 * @param {string} email - User email
 * @param {string} purpose - OTP purpose
 * @returns {Promise<boolean>} True if OTP exists
 */
export const isOTPExists = async (email, purpose) => {
  const key = `otp:${purpose}:${email.toLowerCase()}`;
  const otp = await redis.get(key);
  return !!otp;
};