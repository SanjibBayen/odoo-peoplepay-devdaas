import express from 'express';
import {
  getAllWorkSchedules,
  getWorkScheduleById,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
  getScheduleDays,
  updateScheduleDays,
  recalculateWeeklyHours,
} from '../controllers/workSchedule.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ WORK SCHEDULE CRUD ROUTES ============

// Get all work schedules
router.get(
  '/',
  protect,
  requirePermission('working_schedules', 'read'),
  cacheMiddleware('work-schedules:list', 3600),
  getAllWorkSchedules
);

// Get single work schedule
router.get(
  '/:id',
  protect,
  requirePermission('working_schedules', 'read'),
  cacheMiddleware('work-schedules:detail', 3600),
  getWorkScheduleById
);

// Create work schedule (Admin/HR Manager)
router.post(
  '/',
  protect,
  requirePermission('working_schedules', 'create'),
  async (req, res, next) => {
    await deleteCacheByPattern('work-schedules:*');
    next();
  },
  createWorkSchedule
);

// Update work schedule (Admin/HR Manager)
router.put(
  '/:id',
  protect,
  requirePermission('working_schedules', 'update'),
  async (req, res, next) => {
    await deleteCacheByPattern(`work-schedules:*${req.params.id}*`);
    await deleteCacheByPattern('work-schedules:list*');
    next();
  },
  updateWorkSchedule
);

// Delete work schedule (Admin only)
router.delete(
  '/:id',
  protect,
  requirePermission('working_schedules', 'delete'),
  async (req, res, next) => {
    await deleteCacheByPattern(`work-schedules:*${req.params.id}*`);
    await deleteCacheByPattern('work-schedules:list*');
    next();
  },
  deleteWorkSchedule
);

// ============ SCHEDULE DAYS ROUTES ============

// Get schedule days
router.get(
  '/:id/days',
  protect,
  requirePermission('working_schedules', 'read'),
  cacheMiddleware('work-schedules:days', 3600),
  getScheduleDays
);

// Update schedule days (Admin/HR Manager)
router.put(
  '/:id/days',
  protect,
  requirePermission('working_schedules', 'update'),
  async (req, res, next) => {
    await deleteCacheByPattern(`work-schedules:*${req.params.id}*`);
    await deleteCacheByPattern('work-schedules:list*');
    await deleteCacheByPattern('work-schedules:days*');
    next();
  },
  updateScheduleDays
);

// Recalculate weekly hours (Admin/HR Manager)
router.post(
  '/:id/recalculate',
  protect,
  requirePermission('working_schedules', 'update'),
  async (req, res, next) => {
    await deleteCacheByPattern(`work-schedules:*${req.params.id}*`);
    await deleteCacheByPattern('work-schedules:list*');
    next();
  },
  recalculateWeeklyHours
);

export default router;