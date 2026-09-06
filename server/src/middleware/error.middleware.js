import Sequelize from 'sequelize';

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = Sequelize;

/**
 * Custom Error class for operational errors
 */
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to avoid try-catch blocks
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle Sequelize errors
 */
const handleSequelizeError = (err) => {
  if (err instanceof ValidationError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));

    return new AppError(
      `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'unknown';
    return new AppError(
      `Duplicate value for ${field}. Please use a different value`,
      400,
      'DUPLICATE_ENTRY'
    );
  }

  if (err instanceof ForeignKeyConstraintError) {
    return new AppError(
      'Cannot delete or update record because it is referenced by other records',
      400,
      'FOREIGN_KEY_CONSTRAINT'
    );
  }

  return err;
};

/**
 * Handle JWT errors
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');
  }

  return err;
};

/**
 * Handle PostgreSQL errors
 */
const handleDatabaseError = (err) => {
  if (err.code === '23505') {
    const match = err.detail?.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    const value = match ? match[2] : 'value';
    return new AppError(`Duplicate value for ${field}: ${value}`, 400, 'DUPLICATE_ENTRY');
  }

  if (err.code === '23503') {
    return new AppError('Cannot perform operation due to existing references', 400, 'FOREIGN_KEY_VIOLATION');
  }

  if (err.code === '23514') {
    return new AppError('Data validation failed', 400, 'CHECK_VIOLATION');
  }

  return err;
};

/**
 * Handle Redis errors
 */
const handleRedisError = (err) => {
  if (err.code === 'ECONNREFUSED') {
    return new AppError('Cache service unavailable. Please try again later', 503, 'REDIS_UNAVAILABLE');
  }
  return err;
};

/**
 * Handle generic Error objects (non-AppError)
 */
const handleGenericError = (err) => {
  // If it's already an AppError, return as is
  if (err instanceof AppError) {
    return err;
  }

  // If it's a generic Error with a message about permissions
  if (err.message && err.message.includes('Access denied')) {
    return new AppError(err.message, 403, 'FORBIDDEN');
  }

  // If it's a generic Error thrown from our code
  if (err.message && err.message.includes('not found')) {
    return new AppError(err.message, 404, 'NOT_FOUND');
  }

  // Default for generic errors
  return new AppError(err.message || 'Internal Server Error', err.statusCode || 500, 'INTERNAL_ERROR');
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error;

  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    });
  } else {
    console.error('Error:', {
      message: err.message,
      name: err.name,
      code: err.code,
    });
  }

  // Handle AppError directly
  if (err instanceof AppError) {
    error = err;
  }
  // Handle Sequelize errors
  else if (err.name && err.name.startsWith('Sequelize')) {
    error = handleSequelizeError(err);
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  // Handle PostgreSQL errors
  else if (err.code && err.code.startsWith('23')) {
    error = handleDatabaseError(err);
  }
  // Handle Redis errors
  else if (err.code === 'ECONNREFUSED') {
    error = handleRedisError(err);
  }
  // Handle Multer errors
  else if (err.name === 'MulterError') {
    error = new AppError(`File upload error: ${err.message}`, 400, 'FILE_UPLOAD_ERROR');
  }
  // Handle generic errors
  else {
    error = handleGenericError(err);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(error.errorCode && { errorCode: error.errorCode }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};