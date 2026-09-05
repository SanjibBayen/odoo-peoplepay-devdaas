import express from 'express';
import {
    getAllSalaryRules,
    getSalaryRuleById,
    createSalaryRule,
    updateSalaryRule,
    deleteSalaryRule,
    getRulesByCategory,
} from '../controllers/salaryRule.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ SALARY RULE CRUD ROUTES ============

// Get rules by category (must be before /:id)
router.get(
    '/category/:category',
    protect,
    requirePermission('salary_rules', 'read'),
    cacheMiddleware('salary-rules:category', 3600),
    getRulesByCategory
);

// Get all salary rules
router.get(
    '/',
    protect,
    requirePermission('salary_rules', 'read'),
    cacheMiddleware('salary-rules:list', 3600),
    getAllSalaryRules
);

// Get single salary rule
router.get(
    '/:id',
    protect,
    requirePermission('salary_rules', 'read'),
    cacheMiddleware('salary-rules:detail', 3600),
    getSalaryRuleById
);

// Create salary rule (HR Payroll Manager, Admin)
router.post(
    '/',
    protect,
    requirePermission('salary_rules', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('salary-rules:*');
        next();
    },
    createSalaryRule
);

// Update salary rule (HR Payroll Manager, Admin)
router.put(
    '/:id',
    protect,
    requirePermission('salary_rules', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`salary-rules:*${req.params.id}*`);
        await deleteCacheByPattern('salary-rules:list*');
        await deleteCacheByPattern('salary-rules:category*');
        next();
    },
    updateSalaryRule
);

// Delete salary rule (Admin only)
router.delete(
    '/:id',
    protect,
    requirePermission('salary_rules', 'delete'),
    async(req, res, next) => {
        await deleteCacheByPattern('salary-rules:*');
        next();
    },
    deleteSalaryRule
);

export default router;