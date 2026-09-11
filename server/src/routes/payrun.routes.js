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
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============ PAYRUN CRUD ROUTES (NO PERMISSION CHECKS) ============

// Get all payruns
router.get('/', protect, getAllPayruns);

// Get single payrun
router.get('/:id', protect, getPayrunById);

// Create payrun
router.post('/', protect, createPayrun);

// ============ PAYRUN WIZARD ROUTES ============

// Get eligible employees
router.get('/:id/eligible-employees', protect, getEligibleEmployees);

// Add employees to payrun
router.post('/:id/employees', protect, addEmployeesToPayrun);

// ============ PAYRUN PROCESSING ROUTES ============

// Compute payrun
router.post('/:id/compute', protect, computePayrun);

// Validate payrun
router.post('/:id/validate', protect, validatePayrun);

// Mark payrun as paid
router.post('/:id/mark-paid', protect, markPayrunPaid);

// Send payslips
router.post('/:id/send-payslips', protect, sendPayslips);

// Get payrun warnings
router.get('/:id/warnings', protect, getPayrunWarnings);

export default router;