import Sequelize from 'sequelize';
import JobPosition from '../models/jobposition.model.js';
import Department from '../models/department.model.js';
import Employee from '../models/employee.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ JOB POSITION CRUD ============

/**
 * @desc    Get all job positions
 * @route   GET /api/job-positions
 * @access  Private (HR, Admin)
 */
export const getAllJobPositions = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    active,
    departmentId,
    sortBy = 'name',
    sortOrder = 'ASC',
  } = req.query;

  // Build where clause
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

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await JobPosition.findAndCountAll({
    where,
    include: [
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code'],
      },
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // Get employee count for each position
  const positionsWithCount = await Promise.all(
    rows.map(async (position) => {
      const employeeCount = await Employee.count({
        where: { jobPositionId: position.id, status: 'ACTIVE' },
      });
      return {
        ...position.toJSON(),
        employeeCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: positionsWithCount,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single job position by ID
 * @route   GET /api/job-positions/:id
 * @access  Private
 */
export const getJobPositionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const position = await JobPosition.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code'],
      },
    ],
  });

  if (!position) {
    throw new AppError('Job position not found', 404);
  }

  // Get employee count
  const employeeCount = await Employee.count({
    where: { jobPositionId: id, status: 'ACTIVE' },
  });

  res.status(200).json({
    success: true,
    data: {
      ...position.toJSON(),
      employeeCount,
    },
  });
});

/**
 * @desc    Create new job position
 * @route   POST /api/job-positions
 * @access  Private (Admin only)
 */
export const createJobPosition = asyncHandler(async (req, res, next) => {
  const { name, code, description, departmentId } = req.body;

  // Validate required fields
  if (!name || !code) {
    throw new AppError('Please provide name and code', 400);
  }

  // Check if code exists
  const codeExists = await JobPosition.findOne({ where: { code } });
  if (codeExists) {
    throw new AppError('Position code already exists', 400);
  }

  // Check if name exists
  const nameExists = await JobPosition.findOne({ where: { name } });
  if (nameExists) {
    throw new AppError('Position name already exists', 400);
  }

  // Validate department
  if (departmentId) {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    if (!department.active) {
      throw new AppError('Cannot assign position to inactive department', 400);
    }
  }

  // Create position
  const position = await JobPosition.create({
    name,
    code,
    description,
    departmentId: departmentId || null,
    active: true,
  });

  res.status(201).json({
    success: true,
    message: 'Job position created successfully',
    data: position,
  });
});

/**
 * @desc    Update job position
 * @route   PUT /api/job-positions/:id
 * @access  Private (Admin only)
 */
export const updateJobPosition = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const position = await JobPosition.findByPk(id);
  if (!position) {
    throw new AppError('Job position not found', 404);
  }

  const { name, code, description, departmentId, active } = req.body;

  // Check if code exists (excluding current)
  if (code && code !== position.code) {
    const codeExists = await JobPosition.findOne({
      where: { code, id: { [Op.ne]: id } },
    });
    if (codeExists) {
      throw new AppError('Position code already exists', 400);
    }
  }

  // Check if name exists (excluding current)
  if (name && name !== position.name) {
    const nameExists = await JobPosition.findOne({
      where: { name, id: { [Op.ne]: id } },
    });
    if (nameExists) {
      throw new AppError('Position name already exists', 400);
    }
  }

  // Update fields
  if (name) position.name = name;
  if (code) position.code = code;
  if (description !== undefined) position.description = description;
  if (departmentId !== undefined) position.departmentId = departmentId;
  if (active !== undefined) position.active = active;

  await position.save();

  res.status(200).json({
    success: true,
    message: 'Job position updated successfully',
    data: position,
  });
});

/**
 * @desc    Delete job position
 * @route   DELETE /api/job-positions/:id
 * @access  Private (Admin only)
 */
export const deleteJobPosition = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const position = await JobPosition.findByPk(id);
  if (!position) {
    throw new AppError('Job position not found', 404);
  }

  // Check if has active employees
  const employeeCount = await Employee.count({
    where: { jobPositionId: id, status: 'ACTIVE' },
  });

  if (employeeCount > 0) {
    throw new AppError(
      `Cannot delete position with ${employeeCount} active employee(s)`,
      400
    );
  }

  // Soft delete - deactivate
  position.active = false;
  await position.save();

  res.status(200).json({
    success: true,
    message: 'Job position deactivated successfully',
  });
});

/**
 * @desc    Get positions by department
 * @route   GET /api/job-positions/by-department/:departmentId
 * @access  Private
 */
export const getPositionsByDepartment = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;

  const positions = await JobPosition.findAll({
    where: {
      departmentId,
      active: true,
    },
    attributes: ['id', 'name', 'code'],
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    success: true,
    count: positions.length,
    data: positions,
  });
});