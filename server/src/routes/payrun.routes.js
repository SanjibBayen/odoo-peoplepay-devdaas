import express from 'express';
import {
    createPayrun,
    getEligibleEmployees,
    addEmployeesToPayrun,
    computePayrun,
    validatePayrun,
    markPayrunPaid,
    getAllPayruns,
    getPayrunById,
    getPayrunWarnings,
    sendPayslips,
} from '../controllers/payrun.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ PAYRUN CRUD ROUTES ============

// Get all payruns
router.get(
    '/',
    protect,
    requirePermission('payruns', 'read'),
    cacheMiddleware('payruns:list', 300),
    getAllPayruns
);

// Get single payrun
router.get(
    '/:id',
    protect,
    requirePermission('payruns', 'read'),
    cacheMiddleware('payruns:detail', 300),
    getPayrunById
);

// Create payrun (Step 1: Scope/Period)
router.post(
    '/',
    protect,
    requirePermission('payruns', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('payruns:*');
        next();
    },
    createPayrun
);

// ============ PAYRUN WIZARD ROUTES ============

// Get eligible employees (Step 2: Employee Selection)
router.get(
    '/:id/eligible-employees',
    protect,
    requirePermission('payruns', 'read'),
    getEligibleEmployees
);

// Add employees to payrun
router.post(
    '/:id/employees',
    protect,
    requirePermission('payruns', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`payruns:*${req.params.id}*`);
        next();
    },
    addEmployeesToPayrun
);

// ============ PAYRUN PROCESSING ROUTES ============

// Compute payrun
router.post(
    '/:id/compute',
    protect,
    requirePermission('payruns', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern('payruns:*');
        await deleteCacheByPattern('payslips:*');
        next();
    },
    computePayrun
);

// Validate payrun
router.post(
    '/:id/validate',
    protect,
    requirePermission('payruns', 'validate'),
    async(req, res, next) => {
        await deleteCacheByPattern('payruns:*');
        await deleteCacheByPattern('payslips:*');
        next();
    },
    validatePayrun
);

// Mark payrun as paid
router.post(
    '/:id/mark-paid',
    protect,
    requirePermission('payruns', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern('payruns:*');
        await deleteCacheByPattern('payslips:*');
        next();
    },
    markPayrunPaid
);

// Send payslips
router.post(
    '/:id/send-payslips',
    protect,
    requirePermission('payslips', 'send_email'),
    async(req, res, next) => {
        await deleteCacheByPattern('payruns:*');
        await deleteCacheByPattern('payslips:*');
        next();
    },
    sendPayslips
);

// Get payrun warnings
router.get(
    '/:id/warnings',
    protect,
    requirePermission('payruns', 'read'),
    cacheMiddleware('payruns:warnings', 60),
    getPayrunWarnings
);

export default router;