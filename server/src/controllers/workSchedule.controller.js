import Sequelize from 'sequelize';
import WorkSchedule from '../models/workSchedule.model.js';
import ScheduleDay from '../models/scheduleDay.model.js';
import Employee from '../models/employee.model.js';
import Contract from '../models/contract.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sequelize } from '../config/database.js';

const { Op } = Sequelize;

// ============ WORK SCHEDULE CRUD ============


export const getAllWorkSchedules = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    active,
    scheduleType,
    sortBy = 'name',
    sortOrder = 'ASC',
  } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (active !== undefined) {
    where.active = active === 'true';
  }

  if (scheduleType) {
    where.scheduleType = scheduleType;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await WorkSchedule.findAndCountAll({
    where,
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // Get employee count for each schedule
  const schedulesWithCount = await Promise.all(
    rows.map(async (schedule) => {
      const employeeCount = await Employee.count({
        where: { scheduleId: schedule.id, status: 'ACTIVE' },
      });
      return {
        ...schedule.toJSON(),
        employeeCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: schedulesWithCount,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
});


export const getWorkScheduleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await WorkSchedule.findByPk(id, {
    include: [
      {
        model: ScheduleDay,
        as: 'scheduleDays',
        order: [['dayOfWeek', 'ASC']],
      },
    ],
  });

  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  // Get employee count
  const employeeCount = await Employee.count({
    where: { scheduleId: id, status: 'ACTIVE' },
  });

  // Get contract count
  const contractCount = await Contract.count({
    where: { scheduleId: id, status: 'ACTIVE' },
  });

  // Get schedule overview
  const overview = await schedule.getScheduleOverview();

  res.status(200).json({
    success: true,
    data: {
      ...schedule.toJSON(),
      employeeCount,
      contractCount,
      overview,
    },
  });
});


export const createWorkSchedule = asyncHandler(async (req, res, next) => {
  const { name, code, scheduleType = 'WEEKLY', description, days } = req.body;

  // Validate required fields
  if (!name || !code) {
    throw new AppError('Please provide name and code', 400);
  }

  // Validate schedule type
  if (!['WEEKLY', 'FLEXIBLE', 'SHIFT'].includes(scheduleType)) {
    throw new AppError('Invalid schedule type', 400);
  }

  // Check if code exists
  const codeExists = await WorkSchedule.findOne({ where: { code } });
  if (codeExists) {
    throw new AppError('Schedule code already exists', 400);
  }

  // Use transaction
  const transaction = await sequelize.transaction();

  try {
    // Create schedule
    const schedule = await WorkSchedule.create(
      {
        name,
        code,
        scheduleType,
        weeklyHours: 0,
        active: true,
      },
      { transaction }
    );

    // Create schedule days if provided
    if (days && Array.isArray(days) && days.length > 0) {
      for (const day of days) {
        await ScheduleDay.create(
          {
            scheduleId: schedule.id,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime || null,
            endTime: day.endTime || null,
            breakMinutes: day.breakMinutes || 0,
            isWorkingDay: day.isWorkingDay !== undefined ? day.isWorkingDay : true,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Recalculate weekly hours
    await schedule.recalculateWeeklyHours();

    // Reload with days
    const fullSchedule = await WorkSchedule.findByPk(schedule.id, {
      include: [{ model: ScheduleDay, as: 'scheduleDays' }],
    });

    res.status(201).json({
      success: true,
      message: 'Work schedule created successfully',
      data: fullSchedule,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});


export const updateWorkSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await WorkSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  const { name, code, scheduleType, active } = req.body;

  // Check if code exists (excluding current)
  if (code && code !== schedule.code) {
    const codeExists = await WorkSchedule.findOne({
      where: { code, id: { [Op.ne]: id } },
    });
    if (codeExists) {
      throw new AppError('Schedule code already exists', 400);
    }
  }

  // Update fields
  if (name) schedule.name = name;
  if (code) schedule.code = code;
  if (scheduleType) schedule.scheduleType = scheduleType;
  if (active !== undefined) schedule.active = active;

  await schedule.save();

  res.status(200).json({
    success: true,
    message: 'Work schedule updated successfully',
    data: schedule,
  });
});


export const deleteWorkSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await WorkSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  // Check if assigned to employees
  const employeeCount = await Employee.count({
    where: { scheduleId: id, status: 'ACTIVE' },
  });

  if (employeeCount > 0) {
    throw new AppError(
      `Cannot delete schedule assigned to ${employeeCount} active employee(s)`,
      400
    );
  }

  // Check if assigned to contracts
  const contractCount = await Contract.count({
    where: { scheduleId: id, status: 'ACTIVE' },
  });

  if (contractCount > 0) {
    throw new AppError(
      `Cannot delete schedule assigned to ${contractCount} active contract(s)`,
      400
    );
  }

  // Soft delete
  schedule.active = false;
  await schedule.save();

  res.status(200).json({
    success: true,
    message: 'Work schedule deactivated successfully',
  });
});

// ============ SCHEDULE DAYS MANAGEMENT ============


export const getScheduleDays = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await WorkSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  const days = await ScheduleDay.findAll({
    where: { scheduleId: id },
    order: [['dayOfWeek', 'ASC']],
  });

  const overview = days.map((day) => ({
    id: day.id,
    dayOfWeek: day.dayOfWeek,
    dayName: day.getDayName(),
    isWorkingDay: day.isWorkingDay,
    startTime: day.startTime,
    endTime: day.endTime,
    breakMinutes: day.breakMinutes,
    workingHours: day.calculateWorkingHours(),
    timeRange: day.getTimeRange(),
  }));

  res.status(200).json({
    success: true,
    data: overview,
    weeklyHours: schedule.weeklyHours,
  });
});


export const updateScheduleDays = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { days } = req.body;

  const schedule = await WorkSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  if (!days || !Array.isArray(days) || days.length === 0) {
    throw new AppError('Please provide schedule days', 400);
  }

  // Validate days
  const dayOfWeeks = days.map((d) => d.dayOfWeek);
  const uniqueDays = new Set(dayOfWeeks);
  if (uniqueDays.size !== dayOfWeeks.length) {
    throw new AppError('Duplicate day of week found', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    // Delete existing days
    await ScheduleDay.destroy({
      where: { scheduleId: id },
      transaction,
    });

    // Create new days
    for (const day of days) {
      await ScheduleDay.create(
        {
          scheduleId: id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime || null,
          endTime: day.endTime || null,
          breakMinutes: day.breakMinutes || 0,
          isWorkingDay: day.isWorkingDay !== undefined ? day.isWorkingDay : true,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Recalculate weekly hours
    await schedule.recalculateWeeklyHours();

    // Get updated schedule
    const updatedSchedule = await WorkSchedule.findByPk(id, {
      include: [{ model: ScheduleDay, as: 'scheduleDays' }],
    });

    res.status(200).json({
      success: true,
      message: 'Schedule days updated successfully',
      data: updatedSchedule,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});


export const recalculateWeeklyHours = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const schedule = await WorkSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError('Work schedule not found', 404);
  }

  const weeklyHours = await schedule.recalculateWeeklyHours();

  res.status(200).json({
    success: true,
    message: 'Weekly hours recalculated',
    data: {
      weeklyHours,
    },
  });
});