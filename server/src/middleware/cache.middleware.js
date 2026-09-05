import { getCache, setCache } from '../utils/cache.utils.js';

/**
 * Cache middleware for GET routes
 * @param {string} keyPrefix - Cache key prefix
 * @param {number} expiry - Cache expiry in seconds (default: 300)
 */
export const cacheMiddleware = (keyPrefix, expiry = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated user-specific data (optional)
    // Remove this if you want to cache all GET requests
    // if (req.user) {
    //   return next();
    // }

    // Build cache key
    const key = `${keyPrefix}:${req.originalUrl || req.url}`;

    try {
      // Check cache
      const cachedData = await getCache(key);

      if (cachedData) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          ...cachedData,
        });
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json to cache response
      res.json = function (data) {
        // Only cache successful responses
        if (data && data.success) {
          // Don't store fromCache flag
          const { fromCache, ...dataToCache } = data;
          setCache(key, dataToCache, expiry);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      // Continue without cache on error
      next();
    }
  };
};

/**
 * Clear cache middleware (for POST, PUT, DELETE)
 * @param {string} pattern - Cache key pattern to clear
 */
export const clearCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const { deleteCacheByPattern } = await import('../utils/cache.utils.js');
      await deleteCacheByPattern(pattern);
    } catch (error) {
      console.error('Clear cache error:', error.message);
    }
    next();
  };
};