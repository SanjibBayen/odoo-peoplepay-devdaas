import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartmentHierarchy,
} from '../controllers/department.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ DEPARTMENT CRUD ROUTES ============

// Get hierarchy (must be before /:id to avoid conflict)
router.get(
  '/hierarchy',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('departments:hierarchy', 3600),
  getDepartmentHierarchy
);

// Get all departments
router.get(
  '/',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('departments:list', 3600),
  getAllDepartments
);

// Get single department
router.get(
  '/:id',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('departments:detail', 3600),
  getDepartmentById
);

// Create department (Admin only)
router.post(
  '/',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern('departments:*');
    next();
  },
  createDepartment
);

// Update department (Admin only)
router.put(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`departments:*${req.params.id}*`);
    await deleteCacheByPattern('departments:list*');
    await deleteCacheByPattern('departments:hierarchy*');
    next();
  },
  updateDepartment
);

// Delete department (Admin only)
router.delete(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`departments:*${req.params.id}*`);
    await deleteCacheByPattern('departments:list*');
    await deleteCacheByPattern('departments:hierarchy*');
    next();
  },
  deleteDepartment
);

// ============ DEPARTMENT RELATED ROUTES ============

// Get department's employees
router.get(
  '/:id/employees',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('departments:employees', 300),
  getDepartmentEmployees
);

export default router;