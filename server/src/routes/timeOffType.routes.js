import express from 'express';
import {
    getAllTimeOffTypes,
    getTimeOffTypeById,
    createTimeOffType,
    updateTimeOffType,
    deleteTimeOffType,
} from '../controllers/timeOffType.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ TIME OFF TYPE CRUD ROUTES ============

// Get all time off types
router.get(
    '/',
    protect,
    requirePermission('time_off_types', 'read'),
    cacheMiddleware('time-off-types:list', 3600),
    getAllTimeOffTypes
);

// Get single time off type
router.get(
    '/:id',
    protect,
    requirePermission('time_off_types', 'read'),
    cacheMiddleware('time-off-types:detail', 3600),
    getTimeOffTypeById
);

// Create time off type (Admin only)
router.post(
    '/',
    protect,
    requirePermission('time_off_types', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('time-off-types:*');
        next();
    },
    createTimeOffType
);

// Update time off type (Admin only)
router.put(
    '/:id',
    protect,
    requirePermission('time_off_types', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`time-off-types:*${req.params.id}*`);
        await deleteCacheByPattern('time-off-types:list*');
        next();
    },
    updateTimeOffType
);

// Delete time off type (Admin only)
router.delete(
    '/:id',
    protect,
    requirePermission('time_off_types', 'delete'),
    async(req, res, next) => {
        await deleteCacheByPattern(`time-off-types:*${req.params.id}*`);
        await deleteCacheByPattern('time-off-types:list*');
        next();
    },
    deleteTimeOffType
);

export default router;