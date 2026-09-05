import Sequelize from 'sequelize';
import EmployeeType from '../models/employeeType.model.js';
import Employee from '../models/employee.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ EMPLOYEE TYPE CRUD ============

/**
 * @desc    Get all employee types
 * @route   GET /api/employee-types
 * @access  Private (HR, Admin)
 */
export const getAllEmployeeTypes = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    active,
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

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await EmployeeType.findAndCountAll({
    where,
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // Get employee count for each type
  const typesWithCount = await Promise.all(
    rows.map(async (type) => {
      const employeeCount = await Employee.count({
        where: { employeeTypeId: type.id, status: 'ACTIVE' },
      });
      return {
        ...type.toJSON(),
        employeeCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: typesWithCount,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single employee type by ID
 * @route   GET /api/employee-types/:id
 * @access  Private
 */
export const getEmployeeTypeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const type = await EmployeeType.findByPk(id);

  if (!type) {
    throw new AppError('Employee type not found', 404);
  }

  // Get employee count
  const employeeCount = await Employee.count({
    where: { employeeTypeId: id, status: 'ACTIVE' },
  });

  res.status(200).json({
    success: true,
    data: {
      ...type.toJSON(),
      employeeCount,
    },
  });
});

/**
 * @desc    Create new employee type
 * @route   POST /api/employee-types
 * @access  Private (Admin only)
 */
export const createEmployeeType = asyncHandler(async (req, res, next) => {
  const { name, code, description } = req.body;

  // Validate required fields
  if (!name || !code) {
    throw new AppError('Please provide name and code', 400);
  }

  // Check if code exists
  const codeExists = await EmployeeType.findOne({ where: { code } });
  if (codeExists) {
    throw new AppError('Employee type code already exists', 400);
  }

  // Check if name exists
  const nameExists = await EmployeeType.findOne({ where: { name } });
  if (nameExists) {
    throw new AppError('Employee type name already exists', 400);
  }

  // Create type
  const type = await EmployeeType.create({
    name,
    code,
    description,
    active: true,
  });

  res.status(201).json({
    success: true,
    message: 'Employee type created successfully',
    data: type,
  });
});

/**
 * @desc    Update employee type
 * @route   PUT /api/employee-types/:id
 * @access  Private (Admin only)
 */
export const updateEmployeeType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const type = await EmployeeType.findByPk(id);
  if (!type) {
    throw new AppError('Employee type not found', 404);
  }

  const { name, code, description, active } = req.body;

  // Check if code exists (excluding current)
  if (code && code !== type.code) {
    const codeExists = await EmployeeType.findOne({
      where: { code, id: { [Op.ne]: id } },
    });
    if (codeExists) {
      throw new AppError('Employee type code already exists', 400);
    }
  }

  // Check if name exists (excluding current)
  if (name && name !== type.name) {
    const nameExists = await EmployeeType.findOne({
      where: { name, id: { [Op.ne]: id } },
    });
    if (nameExists) {
      throw new AppError('Employee type name already exists', 400);
    }
  }

  // Update fields
  if (name) type.name = name;
  if (code) type.code = code;
  if (description !== undefined) type.description = description;
  if (active !== undefined) type.active = active;

  await type.save();

  res.status(200).json({
    success: true,
    message: 'Employee type updated successfully',
    data: type,
  });
});

/**
 * @desc    Delete employee type
 * @route   DELETE /api/employee-types/:id
 * @access  Private (Admin only)
 */
export const deleteEmployeeType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const type = await EmployeeType.findByPk(id);
  if (!type) {
    throw new AppError('Employee type not found', 404);
  }

  // Check if has active employees
  const employeeCount = await Employee.count({
    where: { employeeTypeId: id, status: 'ACTIVE' },
  });

  if (employeeCount > 0) {
    throw new AppError(
      `Cannot delete employee type with ${employeeCount} active employee(s)`,
      400
    );
  }

  // Soft delete - deactivate
  type.active = false;
  await type.save();

  res.status(200).json({
    success: true,
    message: 'Employee type deactivated successfully',
  });
});