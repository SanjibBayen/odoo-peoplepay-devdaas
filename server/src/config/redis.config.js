import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Configuration for PeoplePay360
 * Supports both local Redis and Redis Cloud (Upstash)
 */

// Parse Redis URL if provided, otherwise use individual connection params
const getRedisConfig = () => {
  // If REDIS_URL is provided (Redis Cloud / Upstash)
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      username: url.username || 'default',
      password: url.password || undefined,
      db: parseInt(url.pathname.slice(1)) || 0,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }
  
  // Local Redis configuration
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
  };
};

const redisConfig = getRedisConfig();

// Redis connection options
const redisOptions = {
  ...redisConfig,
  
  // Connection settings
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  
  // Retry strategy
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  
  // Error handling
  lazyConnect: false,
  
  // Performance
  enableOfflineQueue: true,
  
  // Key prefix for all keys
  keyPrefix: process.env.REDIS_PREFIX || 'peoplepay360:',
};

// Create Redis client
const redis = new Redis(redisOptions);

// Event handlers
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis is ready to accept commands');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error:', error);
  }
});

redis.on('close', () => {
  console.warn('Redis connection closed');
});

redis.on('reconnecting', (delay) => {
  console.log(`Redis reconnecting in ${delay}ms`);
});

redis.on('end', () => {
  console.warn('Redis connection ended');
});

// Health check function
export const checkRedisHealth = async () => {
  try {
    const ping = await redis.ping();
    return {
      status: 'healthy',
      ping,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Graceful shutdown
export const closeRedis = async () => {
  try {
    await redis.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis:', error.message);
  }
};

// Process handlers for graceful shutdown
process.on('SIGINT', async () => {
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});

export default redis;