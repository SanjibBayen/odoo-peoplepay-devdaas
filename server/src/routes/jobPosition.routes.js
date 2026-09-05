import express from 'express';
import {
  getAllJobPositions,
  getJobPositionById,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
  getPositionsByDepartment,
} from '../controllers/jobPosition.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ JOB POSITION CRUD ROUTES ============

// Get positions by department (must be before /:id)
router.get(
  '/by-department/:departmentId',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('job-positions:by-department', 3600),
  getPositionsByDepartment
);

// Get all job positions
router.get(
  '/',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('job-positions:list', 3600),
  getAllJobPositions
);

// Get single job position
router.get(
  '/:id',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('job-positions:detail', 3600),
  getJobPositionById
);

// Create job position (Admin only)
router.post(
  '/',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern('job-positions:*');
    next();
  },
  createJobPosition
);

// Update job position (Admin only)
router.put(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`job-positions:*${req.params.id}*`);
    await deleteCacheByPattern('job-positions:list*');
    await deleteCacheByPattern('job-positions:by-department*');
    next();
  },
  updateJobPosition
);

// Delete job position (Admin only)
router.delete(
  '/:id',
  protect,
  requirePermission('users', 'manage'),
  async (req, res, next) => {
    await deleteCacheByPattern(`job-positions:*${req.params.id}*`);
    await deleteCacheByPattern('job-positions:list*');
    await deleteCacheByPattern('job-positions:by-department*');
    next();
  },
  deleteJobPosition
);

export default router;