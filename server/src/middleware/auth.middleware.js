import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import redis from '../config/redis.config.js';
import { AppError } from './error.middleware.js';

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const protect = async(req, res, next) => {
    try {
        let token;

        // Check for token in cookies or Authorization header
        if (req.cookies?.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // No token provided
        if (!token) {
            throw new AppError('Not authorized, no token provided', 401);
        }

        // Check if token is blacklisted
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new AppError('Token has been revoked. Please login again', 401);
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Token expired, please login again', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Invalid token', 401);
            }
            throw error;
        }

        // Get user from database 
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] }
        });

        // User not found in database
        if (!user) {
            throw new AppError('User not found', 401);
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AppError('Your account has been deactivated. Please contact HR', 403);
        }

        // Check session (single session validation)
        const sessionKey = `session:${user.id}`;
        const sessionData = await redis.get(sessionKey);

        if (sessionData) {
            const session = JSON.parse(sessionData);

            // Validate session token matches
            if (session.token !== token) {
                throw new AppError('Session expired. Please login again', 401);
            }

            // Update last activity
            session.lastActivity = new Date().toISOString();
            await redis.set(sessionKey, JSON.stringify(session), 'EX', 86400);
        }

        // Check token version
        const tokenVersionKey = `user:${user.id}:tokenVersion`;
        const currentVersion = parseInt((await redis.get(tokenVersionKey)) || '0');

        if (decoded.version !== undefined && decoded.version !== currentVersion) {
            throw new AppError('Token version mismatch. Please login again', 401);
        }

        // Attach user and token to request
        req.user = user;
        req.token = token;
        req.userId = user.id;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication - doesn't throw if no token
 * Useful for routes that work with or without auth
 */
export const optionalAuth = async(req, res, next) => {
    try {
        let token;

        if (req.cookies?.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.scope('withoutPassword').findByPk(decoded.id);

            if (user && user.isActive) {
                req.user = user;
                req.userId = user.id;
            }
        }

        next();
    } catch (error) {
        // Continue without user
        next();
    }
};

/**
 * Restrict to specific roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
    return async(req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Not authorized', 401);
            }

            // Get user roles
            const userRoles = await req.user.getRoles();
            const roleCodes = userRoles.map((role) => role.code);

            // Check if user has any of the required roles
            const hasRole = roles.some((role) => roleCodes.includes(role));

            if (!hasRole) {
                throw new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const requirePermission = (module, action) => {
    return async(req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Not authorized', 401);
            }

            // Check permission
            const hasPermission = await req.user.hasPermission(module, action);

            if (!hasPermission) {
                throw new AppError(`Access denied. Required permission: ${module}:${action}`, 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};


export const requireAnyPermission = (permissions) => {
    return async(req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Not authorized', 401);
            }

            // Check each permission
            for (const perm of permissions) {
                const hasPermission = await req.user.hasPermission(perm.module, perm.action);
                if (hasPermission) {
                    return next();
                }
            }

            throw new AppError('Access denied. Insufficient permissions', 403);
        } catch (error) {
            next(error);
        }
    };
};


export const requireAllPermissions = (permissions) => {
    return async(req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Not authorized', 401);
            }

            // Check each permission
            for (const perm of permissions) {
                const hasPermission = await req.user.hasPermission(perm.module, perm.action);
                if (!hasPermission) {
                    throw new AppError(
                        `Access denied. Required permission: ${perm.module}:${perm.action}`,
                        403
                    );
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};


export const isResourceOwner = (getResourceOwnerId) => {
    return async(req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Not authorized', 401);
            }

            const resourceOwnerId = await getResourceOwnerId(req);

            // Allow if user is owner or has admin access
            if (req.user.id === resourceOwnerId) {
                return next();
            }

            // Check if user has admin role
            const userRoles = await req.user.getRoles();
            const isAdmin = userRoles.some((role) => role.code === 'ADMIN');

            if (isAdmin) {
                return next();
            }

            throw new AppError('Access denied. You can only access your own resources', 403);
        } catch (error) {
            next(error);
        }
    };
};


export const rateLimit = (limit = 100, windowSeconds = 60) => {
    return async(req, res, next) => {
        try {
            const key = `ratelimit:${req.ip}:${req.originalUrl}`;
            const current = await redis.get(key);

            if (current && parseInt(current) >= limit) {
                const ttl = await redis.ttl(key);
                throw new AppError(
                    `Too many requests. Please try again in ${Math.ceil(ttl / 60)} minutes`,
                    429
                );
            }

            if (!current) {
                await redis.set(key, 1, 'EX', windowSeconds);
            } else {
                await redis.incr(key);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};