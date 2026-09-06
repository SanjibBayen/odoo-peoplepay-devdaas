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
import WorkSchedule from '../models/workSchedule.model.js';
import ScheduleDay from '../models/scheduleDay.model.js';
import TimeOffType from '../models/timeOffType.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op, fn, col } = Sequelize;

// ============ EMPLOYEE DASHBOARD ============

export const getEmployeeDashboardKPIs = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({
    where: { userId: req.user.id },
  });

  if (!employee) {
    throw new AppError('Employee record not found', 404);
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const todayAttendance = await Attendance.findOne({
    where: { employeeId: employee.id, workDate: today },
  });

  const monthAttendance = await Attendance.findAll({
    where: {
      employeeId: employee.id,
      workDate: { [Op.between]: [monthStart, monthEnd] },
    },
    order: [['workDate', 'ASC']],
  });

  const totalDays = monthAttendance.length;
  const presentDays = monthAttendance.filter((a) =>
    ['PRESENT', 'LATE', 'OVERTIME'].includes(a.status)
  ).length;
  const absentDays = monthAttendance.filter((a) => a.status === 'ABSENT').length;
  const lateDays = monthAttendance.filter((a) => a.status === 'LATE').length;
  const overtimeDays = monthAttendance.filter((a) => a.status === 'OVERTIME').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const allocations = await TimeOffAllocation.findAll({
    where: {
      employeeId: employee.id,
      status: 'APPROVED',
      validFrom: { [Op.lte]: today },
      validTo: { [Op.gte]: today },
    },
    include: [
      {
        model: TimeOffType,
        as: 'timeOffType',
        attributes: ['id', 'name', 'code'],
      },
    ],
  });

  const leaveBalances = allocations.map((allocation) => ({
    id: allocation.id,
    leaveType: allocation.timeOffType?.name || 'Unknown',
    leaveCode: allocation.timeOffType?.code || 'UNKNOWN',
    allocated: parseFloat(allocation.allocatedAmount) || 0,
    used: parseFloat(allocation.usedAmount) || 0,
    remaining: allocation.calculateRemaining() || 0,
  }));

  const totalLeaveBalance = leaveBalances.reduce((sum, l) => sum + l.remaining, 0);

  const pendingRequests = await TimeOffRequest.findAll({
    where: {
      employeeId: employee.id,
      status: 'PENDING',
    },
    include: [
      {
        model: TimeOffType,
        as: 'timeOffType',
        attributes: ['id', 'name', 'code'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const dayOfWeek = now.getDay();
  let todaySchedule = null;

  if (employee.scheduleId) {
    const scheduleDay = await ScheduleDay.findOne({
      where: {
        scheduleId: employee.scheduleId,
        dayOfWeek,
      },
    });

    if (scheduleDay) {
      todaySchedule = {
        dayName: scheduleDay.getDayName(),
        startTime: scheduleDay.startTime,
        endTime: scheduleDay.endTime,
        breakMinutes: scheduleDay.breakMinutes,
        isWorkingDay: scheduleDay.isWorkingDay,
        workingHours: scheduleDay.calculateWorkingHours(),
        isWeekend: scheduleDay.isWeekend(),
      };
    }
  }

  const recentPayslips = await Payslip.findAll({
    where: { employeeId: employee.id },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'payslipNumber', 'periodStart', 'periodEnd', 'netSalary', 'status'],
  });

  const todayWorkedMinutes = todayAttendance?.workedMinutes || 0;
  const todayBreakMinutes = todayAttendance?.breakMinutes || 0;
  const todayRemainingMinutes = todaySchedule?.workingHours
    ? Math.max(0, todaySchedule.workingHours * 60 - todayWorkedMinutes)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      today: {
        date: today,
        dayOfWeek,
        attendance: todayAttendance
          ? {
              checkIn: todayAttendance.checkIn,
              checkOut: todayAttendance.checkOut,
              workedMinutes: todayWorkedMinutes,
              workedTime: `${Math.floor(todayWorkedMinutes / 60)}h ${String(
                todayWorkedMinutes % 60
              ).padStart(2, '0')}m`,
              status: todayAttendance.status,
              lateMinutes: todayAttendance.lateMinutes || 0,
              overtimeMinutes: todayAttendance.overtimeMinutes || 0,
              earlyExitMinutes: todayAttendance.earlyExitMinutes || 0,
              breakMinutes: todayBreakMinutes,
            }
          : null,
        schedule: todaySchedule,
        remainingMinutes: todayRemainingMinutes,
      },
      metrics: {
        attendanceRate,
        presentDays,
        absentDays,
        lateDays,
        overtimeDays,
        totalDays,
        leaveBalance: totalLeaveBalance,
        pendingRequests: pendingRequests.length,
      },
      leaveBalances,
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        type: r.timeOffType?.name || 'Unknown',
        startDate: r.startDate,
        endDate: r.endDate,
        duration: parseFloat(r.duration) || 0,
        status: r.status,
        reason: r.reason,
      })),
      recentPayslips: recentPayslips.map((p) => ({
        id: p.id,
        payslipNumber: p.payslipNumber,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        netSalary: parseFloat(p.netSalary) || 0,
        status: p.status,
      })),
    },
  });
});

// ============ DASHBOARD KPIs (HR/Admin) ============

export const getDashboardKPIs = asyncHandler(async (req, res, next) => {
  const { periodStart, periodEnd, departmentId, employeeTypeId } = req.query;

  const payslipWhere = { status: { [Op.in]: ['VALIDATED', 'PAID'] } };

  if (periodStart && periodEnd) {
    payslipWhere.periodStart = { [Op.gte]: periodStart };
    payslipWhere.periodEnd = { [Op.lte]: periodEnd };
  }

  const employeeWhere = { status: 'ACTIVE' };
  if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
    employeeWhere.departmentId = departmentId;
  }
  if (employeeTypeId && employeeTypeId !== 'undefined' && employeeTypeId !== 'null') {
    employeeWhere.employeeTypeId = employeeTypeId;
  }

  const filteredEmployees = await Employee.findAll({
    where: employeeWhere,
    attributes: ['id'],
  });

  const employeeIds = filteredEmployees.map((e) => e.id);

  if (employeeIds.length > 0) {
    payslipWhere.employeeId = { [Op.in]: employeeIds };
  }

  const totalNetSalary = (await Payslip.sum('netSalary', { where: payslipWhere })) || 0;
  const payslipCount = await Payslip.count({ where: payslipWhere });
  const averageSalary = payslipCount > 0 ? totalNetSalary / payslipCount : 0;

  const timeOffWhere = { status: 'APPROVED' };
  if (employeeIds.length > 0) {
    timeOffWhere.employeeId = { [Op.in]: employeeIds };
  }
  if (periodStart && periodEnd) {
    timeOffWhere.startDate = { [Op.gte]: periodStart };
    timeOffWhere.endDate = { [Op.lte]: periodEnd };
  }

  const approvedTimeOff = (await TimeOffRequest.sum('duration', { where: timeOffWhere })) || 0;

  const attendanceWhere = {};
  if (employeeIds.length > 0) {
    attendanceWhere.employeeId = { [Op.in]: employeeIds };
  }
  if (periodStart && periodEnd) {
    attendanceWhere.workDate = { [Op.between]: [periodStart, periodEnd] };
  }

  const totalAttendanceRecords = await Attendance.count({ where: attendanceWhere });
  const presentAttendanceRecords = await Attendance.count({
    where: { ...attendanceWhere, status: { [Op.in]: ['PRESENT', 'LATE', 'OVERTIME'] } },
  });
  const absentAttendanceRecords = await Attendance.count({
    where: { ...attendanceWhere, status: 'ABSENT' },
  });
  const lateAttendanceRecords = await Attendance.count({
    where: { ...attendanceWhere, status: 'LATE' },
  });
  const overtimeAttendanceRecords = await Attendance.count({
    where: { ...attendanceWhere, status: 'OVERTIME' },
  });

  const attendanceHealth =
    totalAttendanceRecords > 0
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
      : 0;

  const pendingRequests = await TimeOffRequest.count({
    where: {
      status: 'PENDING',
      ...(employeeIds.length > 0 && { employeeId: { [Op.in]: employeeIds } }),
    },
  });

  res.status(200).json({
    success: true,
    data: {
      totalNetSalary: Math.round(totalNetSalary * 100) / 100,
      payslipCount,
      averageSalary: Math.round(averageSalary * 100) / 100,
      approvedTimeOffDays: parseFloat(approvedTimeOff),
      attendanceHealth: `${attendanceHealth}%`,
      totalEmployees: employeeIds.length,
      pendingRequests,
      attendanceBreakdown: {
        total: totalAttendanceRecords,
        present: presentAttendanceRecords,
        absent: absentAttendanceRecords,
        late: lateAttendanceRecords,
        overtime: overtimeAttendanceRecords,
      },
    },
  });
});

// ============ DEPARTMENT SALARY BREAKDOWN ============

export const getSalaryByDepartment = asyncHandler(async (req, res, next) => {
  const { periodStart, periodEnd } = req.query;

  const payslipWhere = { status: { [Op.in]: ['VALIDATED', 'PAID'] } };

  if (periodStart && periodEnd) {
    payslipWhere.periodStart = { [Op.gte]: periodStart };
    payslipWhere.periodEnd = { [Op.lte]: periodEnd };
  }

  const departments = await Department.findAll({
    where: { active: true },
    attributes: ['id', 'name', 'code'],
    raw: true,
  });

  const departmentData = [];

  for (const department of departments) {
    const employees = await Employee.findAll({
      where: { departmentId: department.id, status: 'ACTIVE' },
      attributes: ['id'],
      raw: true,
    });

    const employeeIds = employees.map((e) => e.id);

    if (employeeIds.length === 0) continue;

    const deptPayslips = await Payslip.findAll({
      where: {
        ...payslipWhere,
        employeeId: { [Op.in]: employeeIds },
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

export const getMonthlyTrends = asyncHandler(async (req, res, next) => {
  const { months = 12 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const payslips = await Payslip.findAll({
    where: {
      status: { [Op.in]: ['VALIDATED', 'PAID'] },
      periodStart: { [Op.gte]: startDate },
    },
    attributes: [
      [fn('DATE_TRUNC', 'month', col('period_start')), 'month'],
      [fn('SUM', col('net_salary')), 'totalNet'],
      [fn('SUM', col('gross_salary')), 'totalGross'],
      [fn('COUNT', col('id')), 'payslipCount'],
      [fn('COUNT', fn('DISTINCT', col('employee_id'))), 'employeeCount'],
    ],
    group: [fn('DATE_TRUNC', 'month', col('period_start'))],
    order: [[fn('DATE_TRUNC', 'month', col('period_start')), 'ASC']],
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

export const getAttendanceOverview = asyncHandler(async (req, res, next) => {
  const { periodStart, periodEnd, departmentId } = req.query;

  const where = {};

  if (periodStart && periodEnd) {
    where.workDate = { [Op.between]: [periodStart, periodEnd] };
  }

  if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
    const employees = await Employee.findAll({
      where: { departmentId },
      attributes: ['id'],
      raw: true,
    });
    where.employeeId = { [Op.in]: employees.map((e) => e.id) };
  }

  const overview = await Attendance.findAll({
    where,
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('overtime_minutes')), 'totalOvertimeMinutes'],
      [fn('SUM', col('late_minutes')), 'totalLateMinutes'],
      [fn('SUM', col('worked_minutes')), 'totalWorkedMinutes'],
    ],
    group: ['status'],
    raw: true,
  });

  const manualEditsCount = await Attendance.count({
    where: { ...where, isManualEntry: true },
  });

  const missingCheckoutCount = await Attendance.count({
    where: { ...where, status: 'MISSING_CHECKOUT' },
  });

  const totalRecords = overview.reduce((sum, item) => sum + parseInt(item.count), 0);
  const presentRecords = overview
    .filter((item) => ['PRESENT', 'LATE', 'OVERTIME'].includes(item.status))
    .reduce((sum, item) => sum + parseInt(item.count), 0);

  res.status(200).json({
    success: true,
    data: {
      totalRecords,
      presentCount: presentRecords,
      attendanceHealth:
        totalRecords > 0 ? `${Math.round((presentRecords / totalRecords) * 100)}%` : '0%',
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

export const getTimeOffOverview = asyncHandler(async (req, res, next) => {
  const { periodStart, periodEnd, departmentId } = req.query;

  const where = {};

  if (periodStart && periodEnd) {
    where.startDate = { [Op.gte]: periodStart };
    where.endDate = { [Op.lte]: periodEnd };
  }

  if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
    const employees = await Employee.findAll({
      where: { departmentId },
      attributes: ['id'],
      raw: true,
    });
    where.employeeId = { [Op.in]: employees.map((e) => e.id) };
  }

  const overview = await TimeOffRequest.findAll({
    where,
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
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

// ============ OPERATIONAL ALERTS (FIXED) ============

export const getOperationalAlerts = asyncHandler(async (req, res, next) => {
  const alerts = [];

  // 1. Payroll warnings - NO include, use raw query
  const warnings = await PayrollWarning.findAll({
    where: { resolved: false },
    attributes: ['id', 'warningType', 'severity', 'message', 'employeeId', 'createdAt'],
    order: [['severity', 'ASC']],
    limit: 20,
    raw: true,
  });

  // Get employee names for warnings (separate query to avoid join issues)
  for (const warning of warnings) {
    let employeeName = null;
    if (warning.employeeId) {
      const emp = await Employee.findByPk(warning.employeeId, {
        attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
        raw: true,
      });
      if (emp) {
        employeeName = `${emp.firstName} ${emp.lastName || ''}`.trim();
      }
    }

    alerts.push({
      type: warning.warningType,
      severity: warning.severity,
      message: warning.message,
      employeeName,
      createdAt: warning.createdAt,
    });
  }

  // 2. Employees with missing bank details - raw query
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
    raw: true,
  });

  employeesMissingBank.forEach((employee) => {
    alerts.push({
      type: 'MISSING_BANK_DETAILS',
      severity: 'WARNING',
      message: `Employee ${employee.employeeCode} has missing bank details`,
      employeeName: `${employee.firstName} ${employee.lastName || ''}`.trim(),
    });
  });

  // 3. Employees with no active contract - optimized single query
  const employeesWithoutContract = await Employee.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
    raw: true,
  });

  const activeContracts = await Contract.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['employeeId'],
    raw: true,
  });

  const employeesWithContract = new Set(activeContracts.map((c) => c.employeeId));

  for (const employee of employeesWithoutContract) {
    if (!employeesWithContract.has(employee.id)) {
      alerts.push({
        type: 'MISSING_CONTRACT',
        severity: 'ERROR',
        message: `Employee ${employee.employeeCode} has no active contract`,
        employeeName: `${employee.firstName} ${employee.lastName || ''}`.trim(),
      });
    }
  }

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts,
  });
});