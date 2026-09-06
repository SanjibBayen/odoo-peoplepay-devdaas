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
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { deleteCacheByPattern } from '../utils/cache.utils.js';

const router = express.Router();

// ============ EMPLOYEE CRUD ROUTES ============

// Get all employees (HR/Admin only)
router.get(
  '/',
  protect,
  requirePermission('employees', 'read_all'),
  cacheMiddleware('employees:list', 300),
  getAllEmployees
);

// Get single employee - Any authenticated user
router.get(
  '/:id',
  protect,
  cacheMiddleware('employees:detail', 300),
  getEmployeeById
);

// Create employee (HR/Admin)
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

// Update employee (HR/Admin)
router.put(
  '/:id',
  protect,
  requirePermission('employees', 'update'),
  async (req, res, next) => {
    await deleteCacheByPattern('employees:*');
    next();
  },
  updateEmployee
);

// Delete employee (Admin only)
router.delete(
  '/:id',
  protect,
  requirePermission('employees', 'delete'),
  async (req, res, next) => {
    await deleteCacheByPattern('employees:*');
    next();
  },
  deleteEmployee
);

// ============ EMPLOYEE RELATED RECORDS (Any authenticated user) ============

// Get employee's contracts
router.get(
  '/:id/contracts',
  protect,
  cacheMiddleware('employee:contracts', 300),
  getEmployeeContracts
);

// Get employee's attendance
router.get(
  '/:id/attendance',
  protect,
  cacheMiddleware('employee:attendance', 300),
  getEmployeeAttendance
);

// Get employee's time off requests
router.get(
  '/:id/time-off-requests',
  protect,
  cacheMiddleware('employee:timeoff', 300),
  getEmployeeTimeOffRequests
);

// Get employee's leave balances
router.get(
  '/:id/leave-balances',
  protect,
  cacheMiddleware('employee:leave-balances', 300),
  getEmployeeLeaveBalances
);

// Get employee's active contract
router.get(
  '/:id/active-contract',
  protect,
  cacheMiddleware('employee:active-contract', 300),
  getEmployeeActiveContract
);

export default router;