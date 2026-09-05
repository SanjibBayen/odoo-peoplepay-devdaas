import express from 'express';
import {
    checkIn,
    checkOut,
    getAllAttendance,
    getAttendanceById,
    getMyAttendance,
    createManualEntry,
    correctAttendance,
    getAttendanceSummary,
} from '../controllers/attendance.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ EMPLOYEE ROUTES ============

// Check-in (Employee)
router.post(
    '/check-in',
    protect,
    requirePermission('attendance', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('attendance:*');
        next();
    },
    checkIn
);

// Check-out (Employee)
router.post(
    '/check-out',
    protect,
    requirePermission('attendance', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('attendance:*');
        next();
    },
    checkOut
);

// Get own attendance (Employee)
router.get(
    '/my-attendance',
    protect,
    requirePermission('attendance', 'read_own'),
    cacheMiddleware('attendance:my', 60),
    getMyAttendance
);

// ============ HR/ADMIN ROUTES ============

// Get attendance summary (must be before /:id)
router.get(
    '/summary',
    protect,
    requirePermission('attendance', 'read_all'),
    cacheMiddleware('attendance:summary', 300),
    getAttendanceSummary
);

// Get all attendance
router.get(
    '/',
    protect,
    requirePermission('attendance', 'read_all'),
    cacheMiddleware('attendance:list', 60),
    getAllAttendance
);

// Manual entry (HR only)
router.post(
    '/manual-entry',
    protect,
    requirePermission('attendance', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('attendance:*');
        next();
    },
    createManualEntry
);

// Get single attendance
router.get(
    '/:id',
    protect,
    requirePermission('attendance', 'read_all'),
    getAttendanceById
);

// Correct attendance (HR only)
router.put(
    '/:id/correct',
    protect,
    requirePermission('attendance', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern('attendance:*');
        next();
    },
    correctAttendance
);

export default router;