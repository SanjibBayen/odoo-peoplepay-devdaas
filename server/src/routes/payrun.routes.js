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
import { protect, restrictTo } from '../middleware/auth.middleware.js';

// Roles allowed to read payruns (Payroll User, Payroll Manager, Admin)
const payrollRoles = ['HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];
// Roles allowed to mutate payruns (Payroll Manager and Admin only)
const payrollManagerRoles = ['HR_PAYROLL_MANAGER', 'ADMIN'];

const router = express.Router();

// ============ PAYRUN CRUD ROUTES ============

// Get all payruns
router.get('/', protect, restrictTo(...payrollRoles), getAllPayruns);

// Get single payrun
router.get('/:id', protect, restrictTo(...payrollRoles), getPayrunById);

// Create payrun
router.post('/', protect, restrictTo(...payrollRoles), createPayrun);

// ============ PAYRUN WIZARD ROUTES ============

// Get eligible employees
router.get('/:id/eligible-employees', protect, restrictTo(...payrollRoles), getEligibleEmployees);

// Add employees to payrun
router.post('/:id/employees', protect, restrictTo(...payrollRoles), addEmployeesToPayrun);

// ============ PAYRUN PROCESSING ROUTES ============

// Compute payrun
router.post('/:id/compute', protect, restrictTo(...payrollRoles), computePayrun);

// Validate payrun — manager approval required
router.post('/:id/validate', protect, restrictTo(...payrollManagerRoles), validatePayrun);

// Mark payrun as paid — manager approval required
router.post('/:id/mark-paid', protect, restrictTo(...payrollManagerRoles), markPayrunPaid);

// Send payslips — manager approval required
router.post('/:id/send-payslips', protect, restrictTo(...payrollManagerRoles), sendPayslips);

// Get payrun warnings
router.get('/:id/warnings', protect, restrictTo(...payrollRoles), getPayrunWarnings);

export default router;