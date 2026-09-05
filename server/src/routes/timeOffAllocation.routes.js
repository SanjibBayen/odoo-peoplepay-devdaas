import express from 'express';
import {
    getAllAllocations,
    getAllocationById,
    createAllocation,
    updateAllocation,
    approveAllocation,
    refuseAllocation,
    deleteAllocation,
    getEmployeeBalances,
} from '../controllers/timeOffAllocation.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ ALLOCATION CRUD ROUTES ============

// Get employee balances (must be before /:id)
router.get(
    '/employee/:employeeId',
    protect,
    requirePermission('time_off_allocations', 'read_all'),
    cacheMiddleware('allocations:employee', 300),
    getEmployeeBalances
);

// Get all allocations
router.get(
    '/',
    protect,
    requirePermission('time_off_allocations', 'read_all'),
    cacheMiddleware('allocations:list', 300),
    getAllAllocations
);

// Get single allocation
router.get(
    '/:id',
    protect,
    requirePermission('time_off_allocations', 'read_all'),
    cacheMiddleware('allocations:detail', 300),
    getAllocationById
);

// Create allocation (HR, Admin)
router.post(
    '/',
    protect,
    requirePermission('time_off_allocations', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('allocations:*');
        next();
    },
    createAllocation
);

// Update allocation (HR, Admin)
router.put(
    '/:id',
    protect,
    requirePermission('time_off_allocations', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern(`allocations:*${req.params.id}*`);
        await deleteCacheByPattern('allocations:list*');
        next();
    },
    updateAllocation
);

// Approve allocation (HR, Admin)
router.put(
    '/:id/approve',
    protect,
    requirePermission('time_off_allocations', 'approve'),
    async(req, res, next) => {
        await deleteCacheByPattern('allocations:*');
        next();
    },
    approveAllocation
);

// Refuse allocation (HR, Admin)
router.put(
    '/:id/refuse',
    protect,
    requirePermission('time_off_allocations', 'approve'),
    async(req, res, next) => {
        await deleteCacheByPattern('allocations:*');
        next();
    },
    refuseAllocation
);

// Delete allocation (Admin only)
router.delete(
    '/:id',
    protect,
    requirePermission('time_off_allocations', 'delete'),
    async(req, res, next) => {
        await deleteCacheByPattern('allocations:*');
        next();
    },
    deleteAllocation
);

export default router;