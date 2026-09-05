import jwt from 'jsonwebtoken';
import redis from '../config/redis.config.js';

/**
 * Generate access token (short-lived)
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'peoplepay',
      audience: 'peoplepay-web'
    }
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'peoplepay',
      audience: 'peoplepay-web'
    }
  );
};

/**
 * Verify token and return decoded payload
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Store session in Redis (single session per user)
 */
export const createSession = async (userId, token, metadata = {}) => {
  const sessionKey = `session:${userId}`;
  
  const sessionData = {
    token,
    createdAt: new Date().toISOString(),
    userAgent: metadata.userAgent || 'Unknown',
    ipAddress: metadata.ipAddress || 'Unknown',
    lastActivity: new Date().toISOString()
  };
  
  // Store session with expiry (24 hours)
  await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 86400);
};

/**
 * Get session from Redis
 */
export const getSession = async (userId) => {
  const sessionKey = `session:${userId}`;
  const sessionData = await redis.get(sessionKey);
  
  if (!sessionData) return null;
  
  return JSON.parse(sessionData);
};

/**
 * Validate session
 */
export const validateSession = async (userId, token) => {
  const session = await getSession(userId);
  
  if (!session) return false;
  if (session.token !== token) return false;
  
  await updateSessionActivity(userId);
  
  return true;
};

/**
 * Update session activity timestamp
 */
export const updateSessionActivity = async (userId) => {
  const session = await getSession(userId);
  
  if (session) {
    session.lastActivity = new Date().toISOString();
    await redis.set(`session:${userId}`, JSON.stringify(session), 'EX', 86400);
  }
};

/**
 * Destroy session (logout)
 */
export const destroySession = async (userId) => {
  await redis.del(`session:${userId}`);
};

/**
 * Blacklist token
 * @param {string} token - Token to blacklist
 * @param {number} ttl - Time to live in seconds
 */
export const blacklistToken = async (token, ttl) => {
  if (ttl > 0) {
    await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} True if blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  const blacklisted = await redis.get(`blacklist:${token}`);
  return !!blacklisted;
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};