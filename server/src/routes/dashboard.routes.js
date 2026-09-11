import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getEmployeeDashboardKPIs,
  getDashboardKPIs,
  getSalaryByDepartment,
  getMonthlyTrends,
  getAttendanceOverview,
  getTimeOffOverview,
  getOperationalAlerts,
} from '../controllers/dashboard.controller.js';

const router = express.Router();


router.get('/employee-kpis', protect, getEmployeeDashboardKPIs);
router.get('/kpis', protect, getDashboardKPIs);
router.get('/salary-by-department', protect, getSalaryByDepartment);
router.get('/monthly-trends', protect, getMonthlyTrends);
router.get('/attendance-overview', protect, getAttendanceOverview);
router.get('/timeoff-overview', protect, getTimeOffOverview);
router.get('/alerts', protect, getOperationalAlerts);

export default router;