import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Creates a deterministic, fixed-length string combining password and pepper.
 * This ensures that the same password always produces the same hash, while still being secure.
 */
const getPepperedHash = (password) => {
  const pepper = process.env.PASSWORD_PEPPER || 'peoplepay360-default-pepper';
  return crypto
    .createHmac('sha256', pepper)
    .update(password)
    .digest('hex'); // Returns a 64-character string
};

/**
 * Hash password with pepper securely
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const processedPassword = getPepperedHash(password);
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(processedPassword, salt);
};

/**
 * Compare password with pepper securely
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
export const comparePassword = async (password, hashedPassword) => {
  const processedPassword = getPepperedHash(password);
  return await bcrypt.compare(processedPassword, hashedPassword);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
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
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength details
 */
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'None' };
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Complexity
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  // Variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score++;
  if (uniqueChars >= 12) score++;
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const label = labels[Math.min(Math.floor(score / 2), labels.length - 1)];
  
  return { score: Math.min(score, 10), label };
};

/**
 * Generate secure random password
 * @param {number} length - Password length
 * @returns {string} Random password
 */
export const generateRandomPassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
  password += '0123456789'[crypto.randomInt(10)];
  password += '!@#$%^&*()'[crypto.randomInt(10)];
  
  // Fill remaining
  for (let i = password.length; i < length; i++) {
    password += charset[crypto.randomInt(charset.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
};