import Sequelize from 'sequelize';
import Department from '../models/department.model.js';
import Employee from '../models/employee.model.js';
import JobPosition from '../models/jobposition.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ DEPARTMENT CRUD ============


export const getAllDepartments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    active,
    parentId,
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

  if (parentId) {
    where.parentId = parentId;
  } else if (parentId === 'null') {
    where.parentId = null;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await Department.findAndCountAll({
    where,
    include: [
      {
        model: Department,
        as: 'parentDepartment',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'employeeCode'],
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

  // Get employee count for each department
  const departmentsWithCount = await Promise.all(
    rows.map(async (dept) => {
      const employeeCount = await Employee.count({
        where: { departmentId: dept.id, status: 'ACTIVE' },
      });
      return {
        ...dept.toJSON(),
        employeeCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: departmentsWithCount,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
    },
  });
});


export const getDepartmentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const department = await Department.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'parentDepartment',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: Department,
        as: 'childDepartments',
        attributes: ['id', 'name', 'code', 'active'],
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'employeeCode'],
      },
      {
        model: JobPosition,
        as: 'jobPositions',
        attributes: ['id', 'name', 'code', 'active'],
      },
    ],
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Get employee count
  const employeeCount = await Employee.count({
    where: { departmentId: id, status: 'ACTIVE' },
  });

  // Get total positions count
  const positionCount = await JobPosition.count({
    where: { departmentId: id, active: true },
  });

  res.status(200).json({
    success: true,
    data: {
      ...department.toJSON(),
      employeeCount,
      positionCount,
    },
  });
});

/**
 * @desc    Create new department
 * @route   POST /api/departments
 * @access  Private (Admin only)
 */
export const createDepartment = asyncHandler(async (req, res, next) => {
  const { name, code, description, managerId, parentId } = req.body;

  // Validate required fields
  if (!name || !code) {
    throw new AppError('Please provide name and code', 400);
  }

  // Check if code exists
  const codeExists = await Department.findOne({ where: { code } });
  if (codeExists) {
    throw new AppError('Department code already exists', 400);
  }

  // Check if name exists
  const nameExists = await Department.findOne({ where: { name } });
  if (nameExists) {
    throw new AppError('Department name already exists', 400);
  }

  // Validate parent department
  if (parentId) {
    const parentDept = await Department.findByPk(parentId);
    if (!parentDept) {
      throw new AppError('Parent department not found', 404);
    }
    if (!parentDept.active) {
      throw new AppError('Cannot create under inactive parent department', 400);
    }
  }

  // Validate manager
  if (managerId) {
    const manager = await Employee.findByPk(managerId);
    if (!manager) {
      throw new AppError('Manager not found', 404);
    }
  }

  // Create department
  const department = await Department.create({
    name,
    code,
    description,
    managerId: managerId || null,
    parentId: parentId || null,
    active: true,
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: department,
  });
});


export const updateDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const department = await Department.findByPk(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const { name, code, description, managerId, parentId, active } = req.body;

  // Check if code exists (excluding current)
  if (code && code !== department.code) {
    const codeExists = await Department.findOne({
      where: { code, id: { [Op.ne]: id } },
    });
    if (codeExists) {
      throw new AppError('Department code already exists', 400);
    }
  }

  // Check if name exists (excluding current)
  if (name && name !== department.name) {
    const nameExists = await Department.findOne({
      where: { name, id: { [Op.ne]: id } },
    });
    if (nameExists) {
      throw new AppError('Department name already exists', 400);
    }
  }

  // Prevent self-reference
  if (parentId && parentId === id) {
    throw new AppError('Department cannot be its own parent', 400);
  }

  // Update fields
  if (name) department.name = name;
  if (code) department.code = code;
  if (description !== undefined) department.description = description;
  if (managerId !== undefined) department.managerId = managerId;
  if (parentId !== undefined) department.parentId = parentId;
  if (active !== undefined) department.active = active;

  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data: department,
  });
});


export const deleteDepartment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const department = await Department.findByPk(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Check if has employees
  const employeeCount = await Employee.count({
    where: { departmentId: id, status: 'ACTIVE' },
  });

  if (employeeCount > 0) {
    throw new AppError(
      `Cannot delete department with ${employeeCount} active employee(s)`,
      400
    );
  }

  // Check if has child departments
  const childCount = await Department.count({
    where: { parentId: id },
  });

  if (childCount > 0) {
    throw new AppError(
      `Cannot delete department with ${childCount} child department(s)`,
      400
    );
  }

  // Soft delete - deactivate
  department.active = false;
  await department.save();

  res.status(200).json({
    success: true,
    message: 'Department deactivated successfully',
  });
});

// ============ DEPARTMENT RELATED ============


export const getDepartmentEmployees = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const department = await Department.findByPk(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const where = { departmentId: id };
  if (status) {
    where.status = status;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await Employee.findAndCountAll({
    where,
    attributes: [
      'id',
      'employeeCode',
      'firstName',
      'lastName',
      'email',
      'status',
      'jobPositionId',
    ],
    include: [
      {
        model: JobPosition,
        as: 'jobPosition',
        attributes: ['id', 'name'],
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [['firstName', 'ASC']],
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


export const getDepartmentHierarchy = asyncHandler(async (req, res, next) => {
  const departments = await Department.findAll({
    where: { parentId: null, active: true },
    include: [
      {
        model: Department,
        as: 'childDepartments',
        where: { active: true },
        required: false,
        include: [
          {
            model: Department,
            as: 'childDepartments',
            where: { active: true },
            required: false,
          },
        ],
      },
    ],
    order: [['name', 'ASC']],
  });

  res.status(200).json({
    success: true,
    data: departments,
  });
});