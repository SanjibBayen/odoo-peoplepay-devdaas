import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Creates a deterministic, fixed-length string combining password and pepper.
 */
const getPepperedHash = (password) => {
  const pepper = process.env.PASSWORD_PEPPER || 'peoplepay360-default-pepper';
  return crypto
    .createHmac('sha256', pepper)
    .update(password)
    .digest('hex');
};

/**
 * Hash password with pepper securely
 */
export const hashPassword = async (password) => {
  const processedPassword = getPepperedHash(password);
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(processedPassword, salt);
};

/**
 * Compare password with pepper securely
 */
export const comparePassword = async (password, hashedPassword) => {
  const processedPassword = getPepperedHash(password);
  return await bcrypt.compare(processedPassword, hashedPassword);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (password && password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (password && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (password && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (password && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

/**
 * Calculate password strength score
 */
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'None' };
  
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score++;
  if (uniqueChars >= 12) score++;
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const label = labels[Math.min(Math.floor(score / 2), labels.length - 1)];
  
  return { score: Math.min(score, 10), label };
};

/**
 * Generate secure random password
 */
export const generateRandomPassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
  password += '0123456789'[crypto.randomInt(10)];
  password += '!@#$%^&*()'[crypto.randomInt(10)];
  
  for (let i = password.length; i < length; i++) {
    password += charset[crypto.randomInt(charset.length)];
  }
  
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
};

// ============ MAGIC LINK FUNCTIONS ============

/**
 * Generate magic link token
 * @returns {string} 64-character hex token
 */
export const generateMagicLinkToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash magic link token for secure storage
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export const hashMagicLinkToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

/**
 * Verify magic link token
 * @param {string} plainToken - Token from URL
 * @param {string} hashedToken - Token stored in database
 * @returns {boolean} True if tokens match
 */
export const verifyMagicLinkToken = (plainToken, hashedToken) => {
  const calculatedHash = hashMagicLinkToken(plainToken);
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHash),
    Buffer.from(hashedToken)
  );
};