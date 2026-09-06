import express from 'express';
import {
  getAllPayslips,
  getPayslipById,
  getMyPayslips,
  sendPayslipEmail,
  generatePayslipPDF,
  getPayslipLines,
} from '../controllers/payslip.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = express.Router();

// Employee routes
router.get('/my-payslips', protect, getMyPayslips);

// HR/Admin routes
router.get('/', protect, cacheMiddleware('payslips:list', 60), getAllPayslips);
router.get('/:id', protect, getPayslipById);
router.get('/:id/lines', protect, getPayslipLines);
router.post('/:id/send', protect, requirePermission('payslips', 'send_email'), sendPayslipEmail);
router.get('/:id/pdf', protect, generatePayslipPDF);

export default router;