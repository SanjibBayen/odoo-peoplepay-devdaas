import express from 'express';
import {
    getAllSalaryStructures,
    getSalaryStructureById,
    createSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    addRulesToStructure,
    removeRuleFromStructure,
    reorderStructureRules,
} from '../controllers/salaryStructure.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ SALARY STRUCTURE CRUD ROUTES ============

// Get all salary structures
router.get(
    '/',
    protect,
    requirePermission('salary_structures', 'read'),
    cacheMiddleware('salary-structures:list', 3600),
    getAllSalaryStructures
);

// Get single salary structure
router.get(
    '/:id',
    protect,
    requirePermission('salary_structures', 'read'),
    cacheMiddleware('salary-structures:detail', 3600),
    getSalaryStructureById
);

// Create salary structure (HR Payroll Manager, Admin)
router.post(
    '/',
    protect,
    requirePermission('salary_structures', 'create'),
    async(req, res, next) => {
        await deleteCacheByPattern('salary-structures:*');
        next();
    },
    createSalaryStructure
);

// Update salary structure (HR Payroll Manager, Admin)
router.put(
    '/:id',
    protect,
    requirePermission('salary_structures', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`salary-structures:*${req.params.id}*`);
        await deleteCacheByPattern('salary-structures:list*');
        next();
    },
    updateSalaryStructure
);

// Delete salary structure (Admin only)
router.delete(
    '/:id',
    protect,
    requirePermission('salary_structures', 'delete'),
    async(req, res, next) => {
        await deleteCacheByPattern('salary-structures:*');
        next();
    },
    deleteSalaryStructure
);

// ============ STRUCTURE RULES MANAGEMENT ============

// Add rules to structure
router.post(
    '/:id/rules',
    protect,
    requirePermission('salary_structures', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`salary-structures:*${req.params.id}*`);
        next();
    },
    addRulesToStructure
);

// Reorder rules in structure
router.put(
    '/:id/rules/reorder',
    protect,
    requirePermission('salary_structures', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`salary-structures:*${req.params.id}*`);
        next();
    },
    reorderStructureRules
);

// Remove rule from structure
router.delete(
    '/:id/rules/:ruleId',
    protect,
    requirePermission('salary_structures', 'update'),
    async(req, res, next) => {
        await deleteCacheByPattern(`salary-structures:*${req.params.id}*`);
        next();
    },
    removeRuleFromStructure
);

export default router;