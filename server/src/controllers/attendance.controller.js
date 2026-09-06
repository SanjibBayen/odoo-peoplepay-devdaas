import Sequelize from 'sequelize';
import Attendance from '../models/attendance.model.js';
import Employee from '../models/employee.model.js';
import WorkSchedule from '../models/workSchedule.model.js';
import ScheduleDay from '../models/scheduleDay.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ CHECK-IN ============

/**
 * @desc    Employee check-in
 * @route   POST /api/attendance/check-in
 * @access  Private (Employee)
 */
export const checkIn = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.body;

  // Get employee
  const employee = await Employee.findByPk(employeeId || req.userId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Check if employee is active
  if (employee.status !== 'ACTIVE') {
    throw new AppError('Employee is not active', 400);
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Check if already checked in
  const existingAttendance = await Attendance.findOne({
    where: { employeeId: employee.id, workDate: today },
  });

  if (existingAttendance && existingAttendance.checkIn) {
    throw new AppError('Already checked in for today', 400);
  }

  // Get employee's schedule
  const schedule = await WorkSchedule.findByPk(employee.scheduleId, {
    include: [{ model: ScheduleDay, as: 'scheduleDays' }],
  });

  if (!schedule) {
    throw new AppError('No work schedule assigned to employee', 400);
  }

  // Get today's schedule (day of week: 0=Sunday, 6=Saturday)
  const dayOfWeek = now.getDay();
  const scheduleDay = schedule.scheduleDays?.find((d) => d.dayOfWeek === dayOfWeek);

  if (!scheduleDay || !scheduleDay.isWorkingDay) {
    throw new AppError('Today is not a working day for this employee', 400);
  }

  // Calculate scheduled start time
  const scheduledStart = scheduleDay.startTime;
  const breakMinutes = scheduleDay.breakMinutes || 0;

  // Calculate scheduled minutes
  const scheduledMinutes = scheduleDay.calculateWorkingHours() * 60;

  // Calculate late minutes
  let lateMinutes = 0;
  if (scheduledStart) {
    const startTimeStr =
      typeof scheduledStart === 'string' ? scheduledStart : scheduledStart.toString();
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    const scheduledCheckIn = new Date(now);
    scheduledCheckIn.setHours(startHours, startMinutes, 0, 0);

    if (now > scheduledCheckIn) {
      lateMinutes = Math.floor((now - scheduledCheckIn) / (1000 * 60));
    }
  }

  // Determine status
  let status = 'PRESENT';
  if (lateMinutes > 0) {
    status = 'LATE';
  }

  // Create or update attendance
  const attendance = await Attendance.create({
    employeeId: employee.id,
    workDate: today,
    checkIn: now,
    breakMinutes,
    scheduledMinutes,
    lateMinutes,
    status,
    isManualEntry: false,
  });

  res.status(201).json({
    success: true,
    message:
      lateMinutes > 0 ? `Checked in. Late by ${lateMinutes} minutes` : 'Checked in successfully',
    data: attendance,
  });
});

// ============ CHECK-OUT ============

/**
 * @desc    Employee check-out
 * @route   POST /api/attendance/check-out
 * @access  Private (Employee)
 */
export const checkOut = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.body;

  // Get employee
  const employee = await Employee.findByPk(employeeId || req.userId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Find today's attendance
  const attendance = await Attendance.findOne({
    where: { employeeId: employee.id, workDate: today },
  });

  if (!attendance) {
    throw new AppError('Please check in first', 400);
  }

  if (attendance.checkOut) {
    throw new AppError('Already checked out for today', 400);
  }

  // Get schedule
  const schedule = await WorkSchedule.findByPk(employee.scheduleId, {
    include: [{ model: ScheduleDay, as: 'scheduleDays' }],
  });

  const dayOfWeek = now.getDay();
  const scheduleDay = schedule?.scheduleDays?.find((d) => d.dayOfWeek === dayOfWeek);

  // Calculate worked minutes
  attendance.checkOut = now;
  attendance.workedMinutes = attendance.calculateWorkedMinutes();

  // Calculate early exit and overtime
  let earlyExitMinutes = 0;
  let overtimeMinutes = 0;

  if (scheduleDay && scheduleDay.isWorkingDay) {
    const scheduledEnd = scheduleDay.endTime;
    if (scheduledEnd) {
      const endTimeStr = typeof scheduledEnd === 'string' ? scheduledEnd : scheduledEnd.toString();
      const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
      const scheduledCheckOut = new Date(now);
      scheduledCheckOut.setHours(endHours, endMinutes, 0, 0);

      if (now < scheduledCheckOut) {
        earlyExitMinutes = Math.floor((scheduledCheckOut - now) / (1000 * 60));
      } else {
        overtimeMinutes = Math.floor((now - scheduledCheckOut) / (1000 * 60));
      }
    }
  }

  attendance.earlyExitMinutes = earlyExitMinutes;
  attendance.overtimeMinutes = overtimeMinutes;

  // Update status
  if (earlyExitMinutes > 0) {
    attendance.status = 'EARLY_EXIT';
  } else if (overtimeMinutes > 0) {
    attendance.status = 'OVERTIME';
  } else if (attendance.lateMinutes > 0) {
    attendance.status = 'LATE';
  } else {
    attendance.status = 'PRESENT';
  }

  await attendance.save();

  res.status(200).json({
    success: true,
    message: 'Checked out successfully',
    data: attendance,
  });
});

// ============ GET ATTENDANCE ============

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Private (HR, Admin)
 */
export const getAllAttendance = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    employeeId,
    status,
    startDate,
    endDate,
    sortBy = 'workDate',
    sortOrder = 'DESC',
  } = req.query;

  const where = {};

  // FIX: If user only has read_own, filter by their own employee
  const hasReadAll = await req.user.hasPermission('attendance', 'read_all');
  const hasReadOwn = await req.user.hasPermission('attendance', 'read_own');

  if (hasReadOwn && !hasReadAll) {
    // Find employee linked to this user
    const Employee = (await import('../models/employee.model.js')).default;
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (employee) {
      where.employeeId = employee.id;
    } else {
      // No employee record, return empty
      return res.status(200).json({
        success: true,
        data: [],
        meta: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 },
      });
    }
  }

  if (employeeId && hasReadAll) {
    where.employeeId = employeeId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.workDate = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.workDate = { [Op.gte]: startDate };
  } else if (endDate) {
    where.workDate = { [Op.lte]: endDate };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email'],
      },
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  res.status(200).json({
    success: true,
    data: rows,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single attendance by ID
 * @route   GET /api/attendance/:id
 * @access  Private
 */
export const getAttendanceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const attendance = await Attendance.findByPk(id, {
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
      },
    ],
  });

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Get own attendance (Employee)
 * @route   GET /api/attendance/my-attendance
 * @access  Private (Employee)
 */
export const getMyAttendance = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;

  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) {
    throw new AppError('Employee record not found', 404);
  }

  const where = { employeeId: employee.id };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    where.workDate = {
      [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    };
  }

  const attendance = await Attendance.findAll({
    where,
    order: [['workDate', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance,
  });
});

// ============ MANUAL ENTRY / CORRECTION ============

/**
 * @desc    Create manual attendance entry (HR only)
 * @route   POST /api/attendance/manual-entry
 * @access  Private (HR, Admin)
 */
export const createManualEntry = asyncHandler(async (req, res, next) => {
  const { employeeId, workDate, checkIn, checkOut, breakMinutes, correctionReason } = req.body;

  if (!employeeId || !workDate) {
    throw new AppError('Please provide employeeId and workDate', 400);
  }

  // Check if employee exists
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Check if attendance already exists
  const existingAttendance = await Attendance.findOne({
    where: { employeeId, workDate },
  });

  if (existingAttendance) {
    throw new AppError('Attendance already exists for this date', 400);
  }

  // Calculate worked minutes
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  let workedMinutes = 0;
  if (checkInDate && checkOutDate) {
    workedMinutes = Math.floor((checkOutDate - checkInDate) / (1000 * 60)) - (breakMinutes || 0);
  }

  // Create attendance
  const attendance = await Attendance.create({
    employeeId,
    workDate,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    breakMinutes: breakMinutes || 0,
    workedMinutes: Math.max(0, workedMinutes),
    isManualEntry: true,
    correctionReason,
    correctedBy: req.user.id,
    correctedAt: new Date(),
    status: 'CORRECTED',
  });

  res.status(201).json({
    success: true,
    message: 'Manual attendance entry created successfully',
    data: attendance,
  });
});

/**
 * @desc    Correct attendance (HR only)
 * @route   PUT /api/attendance/:id/correct
 * @access  Private (HR, Admin)
 */
export const correctAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { checkIn, checkOut, breakMinutes, correctionReason } = req.body;

  const attendance = await Attendance.findByPk(id);
  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  // Update fields
  if (checkIn) attendance.checkIn = new Date(checkIn);
  if (checkOut) attendance.checkOut = new Date(checkOut);
  if (breakMinutes !== undefined) attendance.breakMinutes = breakMinutes;

  // Recalculate worked minutes
  attendance.workedMinutes = attendance.calculateWorkedMinutes();

  // Mark as corrected
  attendance.isManualEntry = true;
  attendance.correctionReason = correctionReason || 'Correction';
  attendance.correctedBy = req.user.id;
  attendance.correctedAt = new Date();
  attendance.status = 'CORRECTED';

  await attendance.save();

  res.status(200).json({
    success: true,
    message: 'Attendance corrected successfully',
    data: attendance,
  });
});

// ============ ATTENDANCE SUMMARY ============

/**
 * @desc    Get attendance summary
 * @route   GET /api/attendance/summary
 * @access  Private (HR, Admin)
 */
export const getAttendanceSummary = asyncHandler(async (req, res, next) => {
  const { employeeId, month, year } = req.query;

  const where = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    where.workDate = {
      [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    };
  }

  // Get summary
  const summary = await Attendance.findAll({
    where,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('worked_minutes')), 'total_worked_minutes'],
      [sequelize.fn('SUM', sequelize.col('overtime_minutes')), 'total_overtime_minutes'],
      [sequelize.fn('SUM', sequelize.col('late_minutes')), 'total_late_minutes'],
    ],
    group: ['status'],
  });

  res.status(200).json({
    success: true,
    data: summary,
  });
});
