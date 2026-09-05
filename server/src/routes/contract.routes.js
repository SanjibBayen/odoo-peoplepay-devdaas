import express from 'express';
import {
    getAllContracts,
    getContractById,
    createContract,
    updateContract,
    terminateContract,
    activateContract,
    getContractsByEmployee,
    getActiveContract,
} from '../controllers/contract.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ CONTRACT QUERY ROUTES (Must be before /:id) ============

// Get contracts by employee
router.get(
    '/employee/:employeeId',
    protect,
    requirePermission('contracts', 'read_all'),
    cacheMiddleware('contracts:employee', 300),
    getContractsByEmployee
);

// Get active contract for employee
router.get(
    '/active/:employeeId',
    protect,
    requirePermission('contracts', 'read_all'),
    cacheMiddleware('contracts:active', 300),
    getActiveContract
);

// ============ CONTRACT CRUD ROUTES ============

// Get all contracts
router.get(
    '/',
    protect,
    requirePermission('contracts', 'read_all'),
    cacheMiddleware('contracts:list', 300),
    getAllContracts
);

// Get single contract
router.get(
    '/:id',
    protect,
    requirePermission('contracts', 'read_all'),
    cacheMiddleware('contracts:detail', 300),
    getContractById
);

// Create contract
router.post(
    '/',
    protect,
    requirePermission('contracts', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('contracts:*');
        await deleteCacheByPattern('employees:*');
        next();
    },
    createContract
);

// Update contract
router.put(
    '/:id',
    protect,
    requirePermission('contracts', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`contracts:*${req.params.id}*`);
        await deleteCacheByPattern('contracts:list*');
        await deleteCacheByPattern('employees:*');
        next();
    },
    updateContract
);

// Delete contract (soft delete)
router.delete(
    '/:id',
    protect,
    requirePermission('contracts', 'delete'),
    async(req, res, next) => {
        await deleteCacheByPattern(`contracts:*${req.params.id}*`);
        await deleteCacheByPattern('contracts:list*');
        await deleteCacheByPattern('employees:*');
        next();
    },
    updateContract // Using update to change status
);

// ============ CONTRACT ACTIONS ============

// Terminate contract
router.post(
    '/:id/terminate',
    protect,
    requirePermission('contracts', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern('contracts:*');
        await deleteCacheByPattern('employees:*');
        next();
    },
    terminateContract
);

// Activate contract
router.post(
    '/:id/activate',
    protect,
    requirePermission('contracts', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern('contracts:*');
        await deleteCacheByPattern('employees:*');
        next();
    },
    activateContract
);

export default router;