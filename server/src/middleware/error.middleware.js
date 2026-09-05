import Sequelize from 'sequelize';

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = Sequelize;


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


export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const handleSequelizeError = (err) => {
    // Validation Error
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

    // Unique Constraint Error
    if (err instanceof UniqueConstraintError) {
        const field = err.errors[0]?.path || 'unknown';
        return new AppError(
            `Duplicate value for ${field}. Please use a different value`,
            400,
            'DUPLICATE_ENTRY'
        );
    }

    // Foreign Key Constraint Error
    if (err instanceof ForeignKeyConstraintError) {
        return new AppError(
            'Cannot delete or update record because it is referenced by other records',
            400,
            'FOREIGN_KEY_CONSTRAINT'
        );
    }

    return err;
};


const handleJWTError = (err) => {
    if (err.name === 'JsonWebTokenError') {
        return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
    }

    if (err.name === 'TokenExpiredError') {
        return new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');
    }

    return err;
};


const handleDatabaseError = (err) => {
    if (err.code === '23505') {
        // unique_violation
        const match = err.detail?.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
        const field = match ? match[1] : 'field';
        const value = match ? match[2] : 'value';
        return new AppError(
            `Duplicate value for ${field}: ${value}`,
            400,
            'DUPLICATE_ENTRY'
        );
    }

    if (err.code === '23503') {
        // foreign_key_violation
        return new AppError(
            'Cannot perform operation due to existing references',
            400,
            'FOREIGN_KEY_VIOLATION'
        );
    }

    if (err.code === '23514') {
        // check_violation
        return new AppError('Data validation failed', 400, 'CHECK_VIOLATION');
    }

    return err;
};


const handleRedisError = (err) => {
    if (err.code === 'ECONNREFUSED') {
        return new AppError(
            'Cache service unavailable. Please try again later',
            503,
            'REDIS_UNAVAILABLE'
        );
    }

    return err;
};

export const errorHandler = (err, req, res, next) => {
    let error = {...err };
    error.message = err.message;

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

    // Handle Sequelize errors
    if (err.name && err.name.startsWith('Sequelize')) {
        error = handleSequelizeError(err);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }

    // Handle PostgreSQL errors
    if (err.code && err.code.startsWith('23')) {
        error = handleDatabaseError(err);
    }

    // Handle Redis errors
    if (err.code === 'ECONNREFUSED') {
        error = handleRedisError(err);
    }

    // Handle Multer errors
    if (err.name === 'MulterError') {
        error = new AppError(`File upload error: ${err.message}`, 400, 'FILE_UPLOAD_ERROR');
    }

    // Send error response
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(error.errorCode && { errorCode: error.errorCode }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};


export const notFound = (req, res, next) => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
    next(error);
};