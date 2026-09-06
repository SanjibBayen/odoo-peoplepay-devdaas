import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeContracts,
  getEmployeeAttendance,
  getEmployeeTimeOffRequests,
  getEmployeeLeaveBalances,
  getEmployeeActiveContract,
} from '../controllers/employee.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ EMPLOYEE CRUD ROUTES ============

// Get all employees
router.get(
  '/',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('employees:list', 300),
  getAllEmployees
);

// Get single employee - FIX: Use read_all instead of read_one
router.get(
  '/:id',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('employees:detail', 300),
  getEmployeeById
);

// Create employee
router.post(
  '/',
  protect,
  requirePermission('employees', 'create'),
  async (req, res, next) => {
    await deleteCacheByPattern('employees:*');
    next();
  },
  createEmployee
);

// Update employee
router.put(
  '/:id',
  protect,
  requirePermission('employees', 'update'),
  async (req, res, next) => {
    await deleteCacheByPattern(`employees:*${req.params.id}*`);
    await deleteCacheByPattern('employees:list*');
    next();
  },
  updateEmployee
);

// Delete employee
router.delete(
  '/:id',
  protect,
  requirePermission('employees', 'delete'),
  async (req, res, next) => {
    await deleteCacheByPattern(`employees:*${req.params.id}*`);
    await deleteCacheByPattern('employees:list*');
    next();
  },
  deleteEmployee
);

// ============ EMPLOYEE RELATED RECORDS ============

// Get employee's contracts
router.get(
  '/:id/contracts',
  protect,
  requirePermission('contracts', 'read_all'),
  cacheMiddleware('employee:contracts', 300),
  getEmployeeContracts
);

// Get employee's attendance
router.get(
  '/:id/attendance',
  protect,
  requirePermission('attendance', 'read_all'),
  cacheMiddleware('employee:attendance', 300),
  getEmployeeAttendance
);

// Get employee's time off requests
router.get(
  '/:id/time-off-requests',
  protect,
  requirePermission('time_off_requests', 'read_all'),
  cacheMiddleware('employee:timeoff', 300),
  getEmployeeTimeOffRequests
);

// Get employee's leave balances
router.get(
  '/:id/leave-balances',
  protect,
  requirePermission('time_off_allocations', 'read_all'),
  cacheMiddleware('employee:leave-balances', 300),
  getEmployeeLeaveBalances
);

// Get employee's active contract
router.get(
  '/:id/active-contract',
  protect,
  requirePermission('contracts', 'read_all'),
  cacheMiddleware('employee:active-contract', 300),
  getEmployeeActiveContract
);

export default router;