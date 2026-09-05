import Sequelize from 'sequelize';
import TimeOffAllocation from '../models/timeOffAllocation.model.js';
import TimeOffType from '../models/timeOffType.model.js';
import Employee from '../models/employee.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ ALLOCATION CRUD ============

/**
 * @desc    Get all allocations
 * @route   GET /api/time-off-allocations
 * @access  Private (HR, Admin)
 */
export const getAllAllocations = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            employeeId,
            timeOffTypeId,
            status,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
    } = req.query;

    const where = {};

    if (employeeId) {
        where.employeeId = employeeId;
    }

    if (timeOffTypeId) {
        where.timeOffTypeId = timeOffTypeId;
    }

    if (status) {
        where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await TimeOffAllocation.findAndCountAll({
        where,
        include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
            },
            {
                model: TimeOffType,
                as: 'timeOffType',
                attributes: ['id', 'name', 'code', 'unit'],
            },
        ],
        order: [
            [sortBy, sortOrder]
        ],
        limit: parseInt(limit),
        offset,
        distinct: true,
    });

    // Calculate remaining for each
    const allocationsWithRemaining = rows.map((allocation) => ({
        ...allocation.toJSON(),
        remainingAmount: allocation.calculateRemaining(),
    }));

    res.status(200).json({
        success: true,
        data: allocationsWithRemaining,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
        },
    });
});

/**
 * @desc    Get single allocation
 * @route   GET /api/time-off-allocations/:id
 * @access  Private
 */
export const getAllocationById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const allocation = await TimeOffAllocation.findByPk(id, {
        include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
            },
            {
                model: TimeOffType,
                as: 'timeOffType',
                attributes: ['id', 'name', 'code', 'unit'],
            },
        ],
    });

    if (!allocation) {
        throw new AppError('Allocation not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            ...allocation.toJSON(),
            remainingAmount: allocation.calculateRemaining(),
        },
    });
});

/**
 * @desc    Create allocation
 * @route   POST /api/time-off-allocations
 * @access  Private (HR, Admin)
 */
export const createAllocation = asyncHandler(async(req, res, next) => {
    const {
        employeeId,
        timeOffTypeId,
        allocatedAmount,
        validFrom,
        validTo,
        notes,
    } = req.body;

    if (!employeeId || !timeOffTypeId || !allocatedAmount || !validFrom || !validTo) {
        throw new AppError('Please provide employeeId, timeOffTypeId, allocatedAmount, validFrom, and validTo', 400);
    }

    // Validate employee
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    // Validate time off type
    const timeOffType = await TimeOffType.findByPk(timeOffTypeId);
    if (!timeOffType) {
        throw new AppError('Time off type not found', 404);
    }

    if (!timeOffType.active) {
        throw new AppError('Time off type is inactive', 400);
    }

    // Validate dates
    if (new Date(validTo) < new Date(validFrom)) {
        throw new AppError('validTo must be after validFrom', 400);
    }

    // Check for overlapping allocation for same type
    const existingAllocation = await TimeOffAllocation.findOne({
        where: {
            employeeId,
            timeOffTypeId,
            status: {
                [Op.in]: ['APPROVED', 'PENDING'] },
            [Op.or]: [{
                    validFrom: {
                        [Op.between]: [validFrom, validTo] },
                },
                {
                    validTo: {
                        [Op.between]: [validFrom, validTo] },
                },
            ],
        },
    });

    if (existingAllocation) {
        throw new AppError('An allocation already exists for this period', 400);
    }

    // Create allocation
    const allocation = await TimeOffAllocation.create({
        employeeId,
        timeOffTypeId,
        allocatedAmount,
        usedAmount: 0,
        remainingAmount: allocatedAmount,
        validFrom,
        validTo,
        status: 'DRAFT',
        notes,
    });

    res.status(201).json({
        success: true,
        message: 'Allocation created successfully',
        data: allocation,
    });
});

/**
 * @desc    Update allocation
 * @route   PUT /api/time-off-allocations/:id
 * @access  Private (HR, Admin)
 */
export const updateAllocation = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const allocation = await TimeOffAllocation.findByPk(id);
    if (!allocation) {
        throw new AppError('Allocation not found', 404);
    }

    const { allocatedAmount, validFrom, validTo, notes } = req.body;

    // Only allow update if status is DRAFT or PENDING
    if (allocation.status === 'APPROVED') {
        throw new AppError('Cannot update approved allocation', 400);
    }

    if (allocatedAmount !== undefined) {
        allocation.allocatedAmount = allocatedAmount;
        allocation.remainingAmount = allocatedAmount - allocation.usedAmount;
    }
    if (validFrom) allocation.validFrom = validFrom;
    if (validTo) allocation.validTo = validTo;
    if (notes !== undefined) allocation.notes = notes;

    await allocation.save();

    res.status(200).json({
        success: true,
        message: 'Allocation updated successfully',
        data: allocation,
    });
});

/**
 * @desc    Approve allocation
 * @route   PUT /api/time-off-allocations/:id/approve
 * @access  Private (HR, Admin)
 */
export const approveAllocation = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const allocation = await TimeOffAllocation.findByPk(id);
    if (!allocation) {
        throw new AppError('Allocation not found', 404);
    }

    if (allocation.status === 'APPROVED') {
        throw new AppError('Allocation already approved', 400);
    }

    allocation.status = 'APPROVED';
    allocation.approvedBy = req.user.id;
    allocation.approvedAt = new Date();
    allocation.remainingAmount = allocation.allocatedAmount - allocation.usedAmount;

    await allocation.save();

    res.status(200).json({
        success: true,
        message: 'Allocation approved successfully',
        data: allocation,
    });
});

/**
 * @desc    Refuse allocation
 * @route   PUT /api/time-off-allocations/:id/refuse
 * @access  Private (HR, Admin)
 */
export const refuseAllocation = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;

    const allocation = await TimeOffAllocation.findByPk(id);
    if (!allocation) {
        throw new AppError('Allocation not found', 404);
    }

    if (allocation.status === 'APPROVED') {
        throw new AppError('Cannot refuse approved allocation', 400);
    }

    allocation.status = 'REFUSED';
    allocation.notes = reason || allocation.notes;
    allocation.approvedBy = req.user.id;
    allocation.approvedAt = new Date();

    await allocation.save();

    res.status(200).json({
        success: true,
        message: 'Allocation refused successfully',
        data: allocation,
    });
});

/**
 * @desc    Delete allocation
 * @route   DELETE /api/time-off-allocations/:id
 * @access  Private (Admin only)
 */
export const deleteAllocation = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const allocation = await TimeOffAllocation.findByPk(id);
    if (!allocation) {
        throw new AppError('Allocation not found', 404);
    }

    if (allocation.status === 'APPROVED' && allocation.usedAmount > 0) {
        throw new AppError('Cannot delete allocation with used balance', 400);
    }

    await allocation.destroy();

    res.status(200).json({
        success: true,
        message: 'Allocation deleted successfully',
    });
});

/**
 * @desc    Get employee's leave balances
 * @route   GET /api/time-off-allocations/employee/:employeeId
 * @access  Private
 */
export const getEmployeeBalances = asyncHandler(async(req, res, next) => {
    const { employeeId } = req.params;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    const allocations = await TimeOffAllocation.findAll({
        where: {
            employeeId,
            status: 'APPROVED',
        },
        include: [{
            model: TimeOffType,
            as: 'timeOffType',
            attributes: ['id', 'name', 'code', 'unit'],
        }, ],
    });

    const balances = allocations.map((allocation) => ({
        id: allocation.id,
        leaveType: allocation.timeOffType ? .name,
        leaveCode: allocation.timeOffType ? .code,
        unit: allocation.timeOffType ? .unit,
        allocated: parseFloat(allocation.allocatedAmount),
        used: parseFloat(allocation.usedAmount),
        remaining: allocation.calculateRemaining(),
        validFrom: allocation.validFrom,
        validTo: allocation.validTo,
    }));

    res.status(200).json({
        success: true,
        count: balances.length,
        data: balances,
    });
});