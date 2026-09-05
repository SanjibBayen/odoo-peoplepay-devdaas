import Sequelize from 'sequelize';
import TimeOffType from '../models/timeOffType.model.js';
import TimeOffAllocation from '../models/timeOffAllocation.model.js';
import TimeOffRequest from '../models/timeOffRequest.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ TIME OFF TYPE CRUD ============

/**
 * @desc    Get all time off types
 * @route   GET /api/time-off-types
 * @access  Private (HR, Admin)
 */
export const getAllTimeOffTypes = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            search,
            active,
            unit,
            sortBy = 'name',
            sortOrder = 'ASC',
    } = req.query;

    const where = {};

    if (search) {
        where[Op.or] = [
            { name: {
                    [Op.iLike]: `%${search}%` } },
            { code: {
                    [Op.iLike]: `%${search}%` } },
        ];
    }

    if (active !== undefined) {
        where.active = active === 'true';
    }

    if (unit) {
        where.unit = unit;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await TimeOffType.findAndCountAll({
        where,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [
            [sortBy, sortOrder]
        ],
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
 * @desc    Get single time off type
 * @route   GET /api/time-off-types/:id
 * @access  Private
 */
export const getTimeOffTypeById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const type = await TimeOffType.findByPk(id);

    if (!type) {
        throw new AppError('Time off type not found', 404);
    }

    res.status(200).json({
        success: true,
        data: type,
    });
});

/**
 * @desc    Create time off type
 * @route   POST /api/time-off-types
 * @access  Private (Admin only)
 */
export const createTimeOffType = asyncHandler(async(req, res, next) => {
    const {
        name,
        code,
        description,
        unit,
        requiresAllocation,
        requiresApproval,
        approvalMode,
        payrollIntegration,
        isPaid,
        maxDaysPerRequest,
        maxDaysPerYear,
        carryForward,
    } = req.body;

    if (!name || !code) {
        throw new AppError('Please provide name and code', 400);
    }

    // Check if code exists
    const codeExists = await TimeOffType.findOne({ where: { code } });
    if (codeExists) {
        throw new AppError('Time off type code already exists', 400);
    }

    const type = await TimeOffType.create({
        name,
        code,
        description,
        unit: unit || 'DAYS',
        requiresAllocation: requiresAllocation !== undefined ? requiresAllocation : true,
        requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
        approvalMode: approvalMode || 'MANAGER_APPROVAL',
        payrollIntegration: payrollIntegration !== undefined ? payrollIntegration : true,
        isPaid: isPaid !== undefined ? isPaid : true,
        maxDaysPerRequest,
        maxDaysPerYear,
        carryForward: carryForward !== undefined ? carryForward : false,
        active: true,
    });

    res.status(201).json({
        success: true,
        message: 'Time off type created successfully',
        data: type,
    });
});

/**
 * @desc    Update time off type
 * @route   PUT /api/time-off-types/:id
 * @access  Private (Admin only)
 */
export const updateTimeOffType = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const type = await TimeOffType.findByPk(id);
    if (!type) {
        throw new AppError('Time off type not found', 404);
    }

    const {
        name,
        code,
        description,
        unit,
        requiresAllocation,
        requiresApproval,
        approvalMode,
        payrollIntegration,
        isPaid,
        maxDaysPerRequest,
        maxDaysPerYear,
        carryForward,
        active,
    } = req.body;

    if (code && code !== type.code) {
        const codeExists = await TimeOffType.findOne({
            where: { code, id: {
                    [Op.ne]: id } },
        });
        if (codeExists) {
            throw new AppError('Time off type code already exists', 400);
        }
    }

    if (name) type.name = name;
    if (code) type.code = code;
    if (description !== undefined) type.description = description;
    if (unit) type.unit = unit;
    if (requiresAllocation !== undefined) type.requiresAllocation = requiresAllocation;
    if (requiresApproval !== undefined) type.requiresApproval = requiresApproval;
    if (approvalMode) type.approvalMode = approvalMode;
    if (payrollIntegration !== undefined) type.payrollIntegration = payrollIntegration;
    if (isPaid !== undefined) type.isPaid = isPaid;
    if (maxDaysPerRequest !== undefined) type.maxDaysPerRequest = maxDaysPerRequest;
    if (maxDaysPerYear !== undefined) type.maxDaysPerYear = maxDaysPerYear;
    if (carryForward !== undefined) type.carryForward = carryForward;
    if (active !== undefined) type.active = active;

    await type.save();

    res.status(200).json({
        success: true,
        message: 'Time off type updated successfully',
        data: type,
    });
});

/**
 * @desc    Delete time off type
 * @route   DELETE /api/time-off-types/:id
 * @access  Private (Admin only)
 */
export const deleteTimeOffType = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const type = await TimeOffType.findByPk(id);
    if (!type) {
        throw new AppError('Time off type not found', 404);
    }

    // Check if has active requests
    const requestCount = await TimeOffRequest.count({
        where: { timeOffTypeId: id, status: {
                [Op.in]: ['PENDING', 'APPROVED'] } },
    });

    if (requestCount > 0) {
        throw new AppError(
            `Cannot delete type with ${requestCount} active request(s)`,
            400
        );
    }

    type.active = false;
    await type.save();

    res.status(200).json({
        success: true,
        message: 'Time off type deactivated successfully',
    });
});