import jwt from 'jsonwebtoken';
import redis from '../config/redis.config.js';

/**
 * Generate access token (short-lived)
 * @param {string} userId - User ID
 * @param {number} tokenVersion - Token version for rotation
 * @returns {string} JWT token
 */
export const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { 
      id: userId,
      version: tokenVersion,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'peoplepay360',
      audience: 'peoplepay360-web'
    }
  );
};

/**
 * Generate refresh token (long-lived)
 * @param {string} userId - User ID
 * @param {number} tokenVersion - Token version for rotation
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { 
      id: userId,
      version: tokenVersion,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'peoplepay360',
      audience: 'peoplepay360-web'
    }
  );
};

/**
 * Verify token and return decoded payload
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded payload
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
 * @param {string} token - Access token
 * @returns {Object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Store session in Redis (single session per user)
 * @param {string} userId - User ID
 * @param {string} token - Access token
 * @param {Object} metadata - Session metadata
 * @returns {Promise<void>}
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
  
  // Store session version for invalidation
  await redis.set(`session:${userId}:version`, Date.now().toString());
};

/**
 * Get session from Redis
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Session data
 */
export const getSession = async (userId) => {
  const sessionKey = `session:${userId}`;
  const sessionData = await redis.get(sessionKey);
  
  if (!sessionData) return null;
  
  return JSON.parse(sessionData);
};

/**
 * Validate session
 * @param {string} userId - User ID
 * @param {string} token - Access token
 * @returns {Promise<boolean>} True if session is valid
 */
export const validateSession = async (userId, token) => {
  const session = await getSession(userId);
  
  if (!session) return false;
  if (session.token !== token) return false;
  
  // Update last activity
  await updateSessionActivity(userId);
  
  return true;
};

/**
 * Update session activity timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
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
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const destroySession = async (userId) => {
  await redis.del(`session:${userId}`);
  await redis.del(`session:${userId}:version`);
  
  // Increment session version to invalidate all tokens
  const versionKey = `user:${userId}:tokenVersion`;
  const currentVersion = await redis.get(versionKey) || '0';
  await redis.set(versionKey, (parseInt(currentVersion) + 1).toString());
};

/**
 * Get token version for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Token version
 */
export const getTokenVersion = async (userId) => {
  const versionKey = `user:${userId}:tokenVersion`;
  const version = await redis.get(versionKey);
  return version ? parseInt(version) : 0;
};

/**
 * Blacklist token
 * @param {string} token - Token to blacklist
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<void>}
 */
export const blacklistToken = async (token, ttl) => {
  if (ttl > 0) {
    await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {Promise<boolean>} True if blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  const blacklisted = await redis.get(`blacklist:${token}`);
  return !!blacklisted;
};

/**
 * Generate token pair and create session
 * @param {string} userId - User ID
 * @param {Object} metadata - Session metadata
 * @returns {Promise<Object>} Token pair
 */
export const generateTokenPair = async (userId, metadata = {}) => {
  const tokenVersion = await getTokenVersion(userId);
  
  const accessToken = generateToken(userId, tokenVersion);
  const refreshToken = generateRefreshToken(userId, tokenVersion);
  
  // Create session
  await createSession(userId, accessToken, metadata);
  
  return {
    accessToken,
    refreshToken,
    tokenVersion
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token pair
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new Error('Refresh token has been revoked');
    }
    
    // Check token version
    const currentVersion = await getTokenVersion(decoded.id);
    if (decoded.version !== currentVersion) {
      throw new Error('Token version mismatch');
    }
    
    // Blacklist old refresh token (rotation)
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(refreshToken, ttl);
    
    // Generate new token pair
    const newTokenPair = await generateTokenPair(decoded.id);
    
    return newTokenPair;
  } catch (error) {
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};