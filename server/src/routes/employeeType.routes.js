import express from 'express';
import {
  getAllEmployeeTypes,
  getEmployeeTypeById,
  createEmployeeType,
  updateEmployeeType,
  deleteEmployeeType,
} from '../controllers/employeeType.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ EMPLOYEE TYPE CRUD ROUTES ============

// Get all employee types
router.get(
  '/',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('employee-types:list', 3600),
  getAllEmployeeTypes
);

// Get single employee type
router.get(
  '/:id',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('employee-types:detail', 3600),
  getEmployeeTypeById
);

// Create employee type (Admin only)
router.post(
  '/',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern('employee-types:*');
    next();
  },
  createEmployeeType
);

// Update employee type (Admin only)
router.put(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`employee-types:*${req.params.id}*`);
    await deleteCacheByPattern('employee-types:list*');
    next();
  },
  updateEmployeeType
);

// Delete employee type (Admin only)
router.delete(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`employee-types:*${req.params.id}*`);
    await deleteCacheByPattern('employee-types:list*');
    next();
  },
  deleteEmployeeType
);

export default router;