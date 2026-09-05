import express from 'express';
import {
    getDashboardKPIs,
    getSalaryByDepartment,
    getMonthlyTrends,
    getAttendanceOverview,
    getTimeOffOverview,
    getOperationalAlerts,
    getCompleteDashboard,
} from '../controllers/dashboard.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = express.Router();

// ============ DASHBOARD ROUTES ============

// Complete dashboard (all data)
router.get(
    '/',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:complete', 300),
    getCompleteDashboard
);

// KPI cards
router.get(
    '/kpis',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:kpis', 300),
    getDashboardKPIs
);

// Salary by department
router.get(
    '/salary-by-department',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:salary-by-department', 300),
    getSalaryByDepartment
);

// Monthly trends
router.get(
    '/monthly-trends',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:monthly-trends', 300),
    getMonthlyTrends
);

// Attendance overview
router.get(
    '/attendance-overview',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:attendance-overview', 300),
    getAttendanceOverview
);

// Time off overview
router.get(
    '/timeoff-overview',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:timeoff-overview', 300),
    getTimeOffOverview
);

// Operational alerts
router.get(
    '/alerts',
    protect,
    requirePermission('reports', 'read'),
    cacheMiddleware('dashboard:alerts', 60),
    getOperationalAlerts
);

export default router;