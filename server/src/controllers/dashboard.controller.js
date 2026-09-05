import Sequelize from 'sequelize';
import Payslip from '../models/payslip.model.js';
import Payrun from '../models/payrun.model.js';
import Employee from '../models/employee.model.js';
import Department from '../models/department.model.js';
import Attendance from '../models/attendance.model.js';
import TimeOffRequest from '../models/timeOffRequest.model.js';
import TimeOffAllocation from '../models/timeOffAllocation.model.js';
import Contract from '../models/contract.model.js';
import EmployeeType from '../models/employeeType.model.js';
import PayrollWarning from '../models/payrollWarning.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op, fn, col } = Sequelize;

// ============ DASHBOARD KPIs ============

/**
 * @desc    Get dashboard KPIs
 * @route   GET /api/dashboard/kpis
 * @access  Private (HR Payroll, Admin)
 */
export const getDashboardKPIs = asyncHandler(async(req, res, next) => {
    const { periodStart, periodEnd, departmentId, employeeTypeId } = req.query;

    // Build filters
    const payslipWhere = { status: {
            [Op.in]: ['VALIDATED', 'PAID'] } };

    if (periodStart && periodEnd) {
        payslipWhere.periodStart = {
            [Op.gte]: periodStart };
        payslipWhere.periodEnd = {
            [Op.lte]: periodEnd };
    }

    const employeeWhere = { status: 'ACTIVE' };
    if (departmentId) {
        employeeWhere.departmentId = departmentId;
    }
    if (employeeTypeId) {
        employeeWhere.employeeTypeId = employeeTypeId;
    }

    // Get employees for department filter
    const filteredEmployees = await Employee.findAll({
        where: employeeWhere,
        attributes: ['id'],
    });

    const employeeIds = filteredEmployees.map((e) => e.id);

    if (employeeIds.length > 0) {
        payslipWhere.employeeId = {
            [Op.in]: employeeIds };
    }

    // KPI 1: Total Net Salary Paid
    const totalNetSalary = await Payslip.sum('netSalary', {
        where: payslipWhere,
    }) || 0;

    // KPI 2: Payslips Generated
    const payslipCount = await Payslip.count({
        where: payslipWhere,
    });

    // KPI 3: Average Salary
    const averageSalary = payslipCount > 0 ? totalNetSalary / payslipCount : 0;

    // KPI 4: Approved Time Off Days
    const timeOffWhere = { status: 'APPROVED' };
    if (employeeIds.length > 0) {
        timeOffWhere.employeeId = {
            [Op.in]: employeeIds };
    }
    if (periodStart && periodEnd) {
        timeOffWhere.startDate = {
            [Op.gte]: periodStart };
        timeOffWhere.endDate = {
            [Op.lte]: periodEnd };
    }

    const approvedTimeOff = await TimeOffRequest.sum('duration', {
        where: timeOffWhere,
    }) || 0;

    // KPI 5: Attendance Health
    const attendanceWhere = {};
    if (employeeIds.length > 0) {
        attendanceWhere.employeeId = {
            [Op.in]: employeeIds };
    }
    if (periodStart && periodEnd) {
        attendanceWhere.workDate = {
            [Op.between]: [periodStart, periodEnd] };
    }

    const totalAttendanceRecords = await Attendance.count({
        where: attendanceWhere,
    });

    const presentAttendanceRecords = await Attendance.count({
        where: {
            ...attendanceWhere,
            status: {
                [Op.in]: ['PRESENT', 'LATE', 'OVERTIME'] },
        },
    });

    const attendanceHealth = totalAttendanceRecords > 0 ?
        Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100) :
        0;

    res.status(200).json({
        success: true,
        data: {
            totalNetSalary: Math.round(totalNetSalary * 100) / 100,
            payslipCount,
            averageSalary: Math.round(averageSalary * 100) / 100,
            approvedTimeOffDays: parseFloat(approvedTimeOff),
            attendanceHealth: `${attendanceHealth}%`,
            totalEmployees: employeeIds.length,
        },
    });
});

// ============ DEPARTMENT SALARY BREAKDOWN ============

/**
 * @desc    Get salary cost by department
 * @route   GET /api/dashboard/salary-by-department
 * @access  Private (HR Payroll, Admin)
 */
export const getSalaryByDepartment = asyncHandler(async(req, res, next) => {
    const { periodStart, periodEnd } = req.query;

    const payslipWhere = { status: {
            [Op.in]: ['VALIDATED', 'PAID'] } };

    if (periodStart && periodEnd) {
        payslipWhere.periodStart = {
            [Op.gte]: periodStart };
        payslipWhere.periodEnd = {
            [Op.lte]: periodEnd };
    }

    const departments = await Department.findAll({
        where: { active: true },
        attributes: ['id', 'name', 'code'],
    });

    const departmentData = [];

    for (const department of departments) {
        const employees = await Employee.findAll({
            where: { departmentId: department.id, status: 'ACTIVE' },
            attributes: ['id'],
        });

        const employeeIds = employees.map((e) => e.id);

        if (employeeIds.length === 0) continue;

        const deptPayslips = await Payslip.findAll({
            where: {
                ...payslipWhere,
                employeeId: {
                    [Op.in]: employeeIds },
            },
            attributes: [
                [fn('SUM', col('net_salary')), 'totalNet'],
                [fn('COUNT', col('id')), 'payslipCount'],
                [fn('AVG', col('net_salary')), 'avgNet'],
            ],
            raw: true,
        });

        departmentData.push({
            departmentId: department.id,
            departmentName: department.name,
            departmentCode: department.code,
            headcount: employeeIds.length,
            totalNetSalary: Math.round(parseFloat(deptPayslips[0]?.totalNet || 0) * 100) / 100,
            payslipCount: parseInt(deptPayslips[0]?.payslipCount || 0),
            averageSalary: Math.round(parseFloat(deptPayslips[0]?.avgNet || 0) * 100) / 100,
        });
    }

    res.status(200).json({
        success: true,
        data: departmentData,
    });
});

// ============ MONTHLY SALARY TRENDS ============

/**
 * @desc    Get monthly net salary trends
 * @route   GET /api/dashboard/monthly-trends
 * @access  Private (HR Payroll, Admin)
 */
export const getMonthlyTrends = asyncHandler(async(req, res, next) => {
    const { months = 12 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const payslips = await Payslip.findAll({
        where: {
            status: {
                [Op.in]: ['VALIDATED', 'PAID'] },
            periodStart: {
                [Op.gte]: startDate },
        },
        attributes: [
            [fn('DATE_TRUNC', 'month', col('period_start')), 'month'],
            [fn('SUM', col('net_salary')), 'totalNet'],
            [fn('SUM', col('gross_salary')), 'totalGross'],
            [fn('COUNT', col('id')), 'payslipCount'],
            [fn('COUNT', fn('DISTINCT', col('employee_id'))), 'employeeCount'],
        ],
        group: [fn('DATE_TRUNC', 'month', col('period_start'))],
        order: [
            [fn('DATE_TRUNC', 'month', col('period_start')), 'ASC']
        ],
        raw: true,
    });

    const formattedTrends = payslips.map((item) => ({
        month: item.month,
        totalNetSalary: Math.round(parseFloat(item.totalNet) * 100) / 100,
        totalGrossSalary: Math.round(parseFloat(item.totalGross) * 100) / 100,
        payslipCount: parseInt(item.payslipCount),
        employeeCount: parseInt(item.employeeCount),
    }));

    res.status(200).json({
        success: true,
        data: formattedTrends,
    });
});

// ============ ATTENDANCE OVERVIEW ============

/**
 * @desc    Get attendance overview
 * @route   GET /api/dashboard/attendance-overview
 * @access  Private (HR Payroll, Admin)
 */
export const getAttendanceOverview = asyncHandler(async(req, res, next) => {
    const { periodStart, periodEnd, departmentId } = req.query;

    const where = {};

    if (periodStart && periodEnd) {
        where.workDate = {
            [Op.between]: [periodStart, periodEnd] };
    }

    if (departmentId) {
        const employees = await Employee.findAll({
            where: { departmentId },
            attributes: ['id'],
        });
        where.employeeId = {
            [Op.in]: employees.map((e) => e.id) };
    }

    const overview = await Attendance.findAll({
        where,
        attributes: [
            'status', [fn('COUNT', col('id')), 'count'],
            [fn('SUM', col('overtime_minutes')), 'totalOvertimeMinutes'],
            [fn('SUM', col('late_minutes')), 'totalLateMinutes'],
            [fn('SUM', col('worked_minutes')), 'totalWorkedMinutes'],
        ],
        group: ['status'],
        raw: true,
    });

    // Get manual edits count
    const manualEditsCount = await Attendance.count({
        where: {
            ...where,
            isManualEntry: true,
        },
    });

    // Get missing checkout count
    const missingCheckoutCount = await Attendance.count({
        where: {
            ...where,
            status: 'MISSING_CHECKOUT',
        },
    });

    // Total records
    const totalRecords = overview.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Present records
    const presentRecords = overview
        .filter((item) => ['PRESENT', 'LATE', 'OVERTIME'].includes(item.status))
        .reduce((sum, item) => sum + parseInt(item.count), 0);

    res.status(200).json({
        success: true,
        data: {
            totalRecords,
            presentCount: presentRecords,
            attendanceHealth: totalRecords > 0 ? `${Math.round((presentRecords / totalRecords) * 100)}%` : '0%',
            manualEdits: manualEditsCount,
            missingCheckouts: missingCheckoutCount,
            statusBreakdown: overview.map((item) => ({
                status: item.status,
                count: parseInt(item.count),
                totalOvertimeMinutes: parseInt(item.totalOvertimeMinutes || 0),
                totalLateMinutes: parseInt(item.totalLateMinutes || 0),
                totalWorkedMinutes: parseInt(item.totalWorkedMinutes || 0),
            })),
        },
    });
});

// ============ TIME OFF OVERVIEW ============

/**
 * @desc    Get time off overview
 * @route   GET /api/dashboard/timeoff-overview
 * @access  Private (HR Payroll, Admin)
 */
export const getTimeOffOverview = asyncHandler(async(req, res, next) => {
    const { periodStart, periodEnd, departmentId } = req.query;

    const where = {};

    if (periodStart && periodEnd) {
        where.startDate = {
            [Op.gte]: periodStart };
        where.endDate = {
            [Op.lte]: periodEnd };
    }

    if (departmentId) {
        const employees = await Employee.findAll({
            where: { departmentId },
            attributes: ['id'],
        });
        where.employeeId = {
            [Op.in]: employees.map((e) => e.id) };
    }

    const overview = await TimeOffRequest.findAll({
        where,
        attributes: [
            'status', [fn('COUNT', col('id')), 'count'],
            [fn('SUM', col('duration')), 'totalDuration'],
        ],
        group: ['status'],
        raw: true,
    });

    const approvedDays = overview
        .filter((item) => item.status === 'APPROVED')
        .reduce((sum, item) => sum + parseFloat(item.totalDuration || 0), 0);

    const pendingRequests = overview
        .filter((item) => item.status === 'PENDING')
        .reduce((sum, item) => sum + parseInt(item.count || 0), 0);

    res.status(200).json({
        success: true,
        data: {
            approvedDays: Math.round(approvedDays * 100) / 100,
            pendingRequests,
            statusBreakdown: overview.map((item) => ({
                status: item.status,
                count: parseInt(item.count),
                totalDuration: parseFloat(item.totalDuration || 0),
            })),
        },
    });
});

// ============ OPERATIONAL ALERTS ============

/**
 * @desc    Get operational alerts
 * @route   GET /api/dashboard/alerts
 * @access  Private (HR Payroll, Admin)
 */
export const getOperationalAlerts = asyncHandler(async(req, res, next) => {
    const alerts = [];

    // 1. Payroll warnings (unresolved)
    const warnings = await PayrollWarning.findAll({
        where: { resolved: false },
        include: [{
            model: Employee,
            as: 'employee',
            attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
        }, ],
        order: [
            ['severity', 'ASC']
        ],
        limit: 20,
    });

    warnings.forEach((warning) => {
        alerts.push({
            type: warning.warningType,
            severity: warning.severity,
            message: warning.message,
            employeeName: warning.employee?.fullName,
            createdAt: warning.createdAt,
        });
    });

    // 2. Employees with missing bank details
    const employeesMissingBank = await Employee.findAll({
        where: {
            status: 'ACTIVE',
            [Op.or]: [
                { bankAccountNumber: null },
                { bankAccountNumber: '' },
                { bankName: null },
                { bankName: '' },
            ],
        },
        attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
    });

    employeesMissingBank.forEach((employee) => {
        alerts.push({
            type: 'MISSING_BANK_DETAILS',
            severity: 'WARNING',
            message: `Employee ${employee.employeeCode} has missing bank details`,
            employeeName: employee.fullName,
        });
    });

    // 3. Employees with no active contract
    const employeesWithoutContract = await Employee.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
    });

    for (const employee of employeesWithoutContract) {
        const activeContract = await Contract.findOne({
            where: {
                employeeId: employee.id,
                status: 'ACTIVE',
            },
        });

        if (!activeContract) {
            alerts.push({
                type: 'MISSING_CONTRACT',
                severity: 'ERROR',
                message: `Employee ${employee.employeeCode} has no active contract`,
                employeeName: employee.fullName,
            });
        }
    }

    res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts,
    });
});

// ============ COMPLETE DASHBOARD ============

/**
 * @desc    Get complete dashboard data
 * @route   GET /api/dashboard
 * @access  Private (HR Payroll, Admin)
 */
export const getCompleteDashboard = asyncHandler(async(req, res, next) => {
    const { periodStart, periodEnd, departmentId, employeeTypeId } = req.query;

    // Get all KPIs
    const kpis = await getDashboardKPIs(req, res);

    // Get department breakdown
    const departmentBreakdown = await getSalaryByDepartment(req, res);

    // Get monthly trends
    const monthlyTrends = await getMonthlyTrends(req, res);

    // Get attendance overview
    const attendanceOverview = await getAttendanceOverview(req, res);

    // Get time off overview
    const timeOffOverview = await getTimeOffOverview(req, res);

    // Get alerts
    const alerts = await getOperationalAlerts(req, res);

    res.status(200).json({
        success: true,
        data: {
            kpis: kpis.data,
            departmentBreakdown: departmentBreakdown.data,
            monthlyTrends: monthlyTrends.data,
            attendanceOverview: attendanceOverview.data,
            timeOffOverview: timeOffOverview.data,
            alerts: alerts.data,
        },
    });
});