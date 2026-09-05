import Sequelize from 'sequelize';
import Employee from '../models/employee.model.js';
import Department from '../models/department.model.js';
import JobPosition from '../models/jobposition.model.js';
import EmployeeType from '../models/employeeType.model.js';
import WorkSchedule from '../models/workSchedule.model.js';
import User from '../models/user.model.js';
import Contract from '../models/contract.model.js';
import Attendance from '../models/attendance.model.js';
import TimeOffRequest from '../models/timeOffRequest.model.js';
import TimeOffAllocation from '../models/timeOffAllocation.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ EMPLOYEE CRUD ============


export const getAllEmployees = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    departmentId,
    employeeTypeId,
    jobPositionId,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = req.query;

  // Build where clause
  const where = {};

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { employeeCode: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (employeeTypeId) {
    where.employeeTypeId = employeeTypeId;
  }

  if (jobPositionId) {
    where.jobPositionId = jobPositionId;
  }

  // Calculate pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get employees
  const { rows, count } = await Employee.findAndCountAll({
    where,
    include: [
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: JobPosition,
        as: 'jobPosition',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: EmployeeType,
        as: 'employeeType',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: WorkSchedule,
        as: 'schedule',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'employeeCode'],
      },
    ],
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / parseInt(limit)),
    currentPage: parseInt(page),
    employees: rows,
  });
});


export const getEmployeeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive'],
      },
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: JobPosition,
        as: 'jobPosition',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: EmployeeType,
        as: 'employeeType',
        attributes: ['id', 'name', 'code'],
      },
      {
        model: WorkSchedule,
        as: 'schedule',
        attributes: ['id', 'name', 'code', 'weeklyHours'],
      },
      {
        model: Employee,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'employeeCode'],
      },
    ],
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  res.status(200).json({
    success: true,
    employee,
  });
});

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (HR, Admin)
 */
export const createEmployee = asyncHandler(async (req, res, next) => {
  const {
    userId,
    employeeCode,
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    address,
    joiningDate,
    departmentId,
    managerId,
    jobPositionId,
    employeeTypeId,
    scheduleId,
    bankAccountNumber,
    bankName,
    ifscCode,
    emergencyContactName,
    emergencyContactPhone,
    notes,
  } = req.body;

  // Validate required fields
  if (!employeeCode || !firstName || !email || !joiningDate) {
    throw new AppError('Please provide employeeCode, firstName, email, and joiningDate', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Please provide a valid email', 400);
  }

  // Check if employee code exists
  const codeExists = await Employee.findOne({ where: { employeeCode } });
  if (codeExists) {
    throw new AppError('Employee code already exists', 400);
  }

  // Check if email exists
  const emailExists = await Employee.findOne({ where: { email } });
  if (emailExists) {
    throw new AppError('Email already exists', 400);
  }

  // Create employee
  const employee = await Employee.create({
    userId: userId || null,
    employeeCode,
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    phone,
    dob,
    gender,
    address,
    joiningDate,
    departmentId: departmentId || null,
    managerId: managerId || null,
    jobPositionId: jobPositionId || null,
    employeeTypeId: employeeTypeId || null,
    scheduleId: scheduleId || null,
    status: 'ACTIVE',
    bankAccountNumber,
    bankName,
    ifscCode,
    emergencyContactName,
    emergencyContactPhone,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    employee,
  });
});

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (HR, Admin)
 */
export const updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const {
    firstName,
    lastName,
    phone,
    dob,
    gender,
    address,
    departmentId,
    managerId,
    jobPositionId,
    employeeTypeId,
    scheduleId,
    status,
    bankAccountNumber,
    bankName,
    ifscCode,
    emergencyContactName,
    emergencyContactPhone,
    notes,
    leavingDate,
  } = req.body;

  // Update fields
  if (firstName) employee.firstName = firstName;
  if (lastName !== undefined) employee.lastName = lastName;
  if (phone !== undefined) employee.phone = phone;
  if (dob !== undefined) employee.dob = dob;
  if (gender !== undefined) employee.gender = gender;
  if (address !== undefined) employee.address = address;
  if (departmentId !== undefined) employee.departmentId = departmentId;
  if (managerId !== undefined) employee.managerId = managerId;
  if (jobPositionId !== undefined) employee.jobPositionId = jobPositionId;
  if (employeeTypeId !== undefined) employee.employeeTypeId = employeeTypeId;
  if (scheduleId !== undefined) employee.scheduleId = scheduleId;
  if (status) employee.status = status;
  if (bankAccountNumber !== undefined) employee.bankAccountNumber = bankAccountNumber;
  if (bankName !== undefined) employee.bankName = bankName;
  if (ifscCode !== undefined) employee.ifscCode = ifscCode;
  if (emergencyContactName !== undefined) employee.emergencyContactName = emergencyContactName;
  if (emergencyContactPhone !== undefined) employee.emergencyContactPhone = emergencyContactPhone;
  if (notes !== undefined) employee.notes = notes;
  if (leavingDate !== undefined) employee.leavingDate = leavingDate;

  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully',
    employee,
  });
});

export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Soft delete - set status to TERMINATED
  employee.status = 'TERMINATED';
  employee.leavingDate = new Date();
  await employee.save();

  res.status(200).json({
    success: true,
    message: 'Employee deactivated successfully',
  });
});

// ============ EMPLOYEE RELATED RECORDS ============


export const getEmployeeContracts = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const contracts = await Contract.findAll({
    where: { employeeId: id },
    order: [['startDate', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: contracts.length,
    contracts,
  });
});


export const getEmployeeAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { month, year } = req.query;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const where = { employeeId: id };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    where.workDate = {
      [Op.between]: [startDate, endDate],
    };
  }

  const attendance = await Attendance.findAll({
    where,
    order: [['workDate', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: attendance.length,
    attendance,
  });
});


export const getEmployeeTimeOffRequests = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const requests = await TimeOffRequest.findAll({
    where: { employeeId: id },
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});


export const getEmployeeLeaveBalances = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const allocations = await TimeOffAllocation.findAll({
    where: {
      employeeId: id,
      status: 'APPROVED',
    },
    include: [
      {
        model: TimeOffType,
        as: 'timeOffType',
        attributes: ['id', 'name', 'code'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    count: allocations.length,
    balances: allocations.map((a) => ({
      id: a.id,
      leaveType: a.timeOffType?.name,
      allocated: a.allocatedAmount,
      used: a.usedAmount,
      remaining: a.remainingAmount,
      validFrom: a.validFrom,
      validTo: a.validTo,
    })),
  });
});


export const getEmployeeActiveContract = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const contract = await employee.getActiveContract();

  res.status(200).json({
    success: true,
    contract: contract || null,
  });
});