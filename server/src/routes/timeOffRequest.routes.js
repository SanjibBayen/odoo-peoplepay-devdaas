import express from 'express';
import {
    getAllRequests,
    getRequestById,
    createRequest,
    getMyRequests,
    approveRequest,
    refuseRequest,
    cancelRequest,
} from '../controllers/timeOffRequest.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ EMPLOYEE ROUTES ============

// Get own requests (must be before /:id)
router.get(
    '/my-requests',
    protect,
    requirePermission('time_off_requests', 'read_own'),
    cacheMiddleware('time-off-requests:my', 60),
    getMyRequests
);

// Submit request (Employee)
router.post(
    '/',
    protect,
    requirePermission('time_off_requests', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('time-off-requests:*');
        await deleteCacheByPattern('allocations:*');
        next();
    },
    createRequest
);

// Cancel request (Employee)
router.put(
    '/:id/cancel',
    protect,
    requirePermission('time_off_requests', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('time-off-requests:*');
        await deleteCacheByPattern('allocations:*');
        next();
    },
    cancelRequest
);

// ============ HR/ADMIN ROUTES ============

// Get all requests
router.get(
    '/',
    protect,
    requirePermission('time_off_requests', 'read_all'),
    cacheMiddleware('time-off-requests:list', 60),
    getAllRequests
);

// Get single request
router.get(
    '/:id',
    protect,
    requirePermission('time_off_requests', 'read_all'),
    cacheMiddleware('time-off-requests:detail', 60),
    getRequestById
);

// Approve request (HR)
router.put(
    '/:id/approve',
    protect,
    requirePermission('time_off_requests', 'approve'),
    async(req, res, next) => {
        await deleteCacheByPattern('time-off-requests:*');
        await deleteCacheByPattern('allocations:*');
        next();
    },
    approveRequest
);

// Refuse request (HR)
router.put(
    '/:id/refuse',
    protect,
    requirePermission('time_off_requests', 'approve'),
    async(req, res, next) => {
        await deleteCacheByPattern('time-off-requests:*');
        await deleteCacheByPattern('allocations:*');
        next();
    },
    refuseRequest
);

export default router;