import Sequelize from 'sequelize';
import TimeOffRequest from '../models/timeOffRequest.model.js';
import TimeOffType from '../models/timeOffType.model.js';
import TimeOffAllocation from '../models/timeOffAllocation.model.js';
import Employee from '../models/employee.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sequelize } from '../config/database.js';

const { Op } = Sequelize;

// ============ REQUEST CRUD ============

/**
 * @desc    Get all time off requests
 * @route   GET /api/time-off-requests
 * @access  Private (HR, Admin)
 */
export const getAllRequests = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            employeeId,
            timeOffTypeId,
            status,
            startDate,
            endDate,
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

    if (startDate && endDate) {
        where.startDate = {
            [Op.gte]: startDate };
        where.endDate = {
            [Op.lte]: endDate };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await TimeOffRequest.findAndCountAll({
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
 * @desc    Get single request
 * @route   GET /api/time-off-requests/:id
 * @access  Private
 */
export const getRequestById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const request = await TimeOffRequest.findByPk(id, {
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
            {
                model: TimeOffAllocation,
                as: 'allocation',
                attributes: ['id', 'allocatedAmount', 'usedAmount', 'remainingAmount'],
            },
        ],
    });

    if (!request) {
        throw new AppError('Request not found', 404);
    }

    res.status(200).json({
        success: true,
        data: request,
    });
});

/**
 * @desc    Submit time off request (Employee)
 * @route   POST /api/time-off-requests
 * @access  Private (Employee)
 */
export const createRequest = asyncHandler(async(req, res, next) => {
    const { timeOffTypeId, startDate, endDate, reason } = req.body;

    if (!timeOffTypeId || !startDate || !endDate) {
        throw new AppError('Please provide timeOffTypeId, startDate, and endDate', 400);
    }

    // Get employee
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) {
        throw new AppError('Employee record not found', 404);
    }

    // Get time off type
    const timeOffType = await TimeOffType.findByPk(timeOffTypeId);
    if (!timeOffType) {
        throw new AppError('Time off type not found', 404);
    }

    if (!timeOffType.active) {
        throw new AppError('Time off type is inactive', 400);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        throw new AppError('End date must be after start date', 400);
    }

    // Calculate duration (Business Engine #5: Date calculation)
    const duration = request.calculateDuration ? request.calculateDuration() :
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check max days per request
    if (timeOffType.maxDaysPerRequest && duration > timeOffType.maxDaysPerRequest) {
        throw new AppError(
            `Maximum ${timeOffType.maxDaysPerRequest} days allowed per request for ${timeOffType.name}`,
            400
        );
    }

    // Check max days per year
    if (timeOffType.maxDaysPerYear) {
        const yearStart = new Date(start.getFullYear(), 0, 1);
        const yearEnd = new Date(start.getFullYear(), 11, 31);

        const yearRequests = await TimeOffRequest.findAll({
            where: {
                employeeId: employee.id,
                timeOffTypeId,
                status: 'APPROVED',
                startDate: {
                    [Op.gte]: yearStart.toISOString().split('T')[0] },
                endDate: {
                    [Op.lte]: yearEnd.toISOString().split('T')[0] },
            },
        });

        const totalYearDays = yearRequests.reduce((sum, r) => sum + parseFloat(r.duration), 0);

        if (totalYearDays + duration > timeOffType.maxDaysPerYear) {
            throw new AppError(
                `Maximum ${timeOffType.maxDaysPerYear} days allowed per year for ${timeOffType.name}. Already used ${totalYearDays} days`,
                400
            );
        }
    }

    // Check for overlapping approved requests
    const overlappingRequest = await TimeOffRequest.findOne({
        where: {
            employeeId: employee.id,
            status: {
                [Op.in]: ['PENDING', 'APPROVED'] },
            [Op.or]: [{
                    startDate: {
                        [Op.between]: [startDate, endDate] },
                },
                {
                    endDate: {
                        [Op.between]: [startDate, endDate] },
                },
                {
                    [Op.and]: [
                        { startDate: {
                                [Op.lte]: startDate } },
                        { endDate: {
                                [Op.gte]: endDate } },
                    ],
                },
            ],
        },
    });

    if (overlappingRequest) {
        throw new AppError('Overlapping leave request already exists', 400);
    }

    // Check allocation if required
    let allocationId = null;

    if (timeOffType.requiresAllocation) {
        const allocation = await TimeOffAllocation.findOne({
            where: {
                employeeId: employee.id,
                timeOffTypeId,
                status: 'APPROVED',
                validFrom: {
                    [Op.lte]: startDate },
                validTo: {
                    [Op.gte]: endDate },
            },
        });

        if (!allocation) {
            throw new AppError('No valid allocation found for this period', 400);
        }

        // Check available balance
        const remaining = allocation.calculateRemaining();
        if (duration > remaining) {
            throw new AppError(
                `Insufficient balance. Available: ${remaining} ${timeOffType.unit.toLowerCase()}, Requested: ${duration} ${timeOffType.unit.toLowerCase()}`,
                400
            );
        }

        allocationId = allocation.id;
    }

    // Create request
    const request = await TimeOffRequest.create({
        employeeId: employee.id,
        timeOffTypeId,
        allocationId,
        startDate,
        endDate,
        duration,
        unit: timeOffType.unit,
        reason,
        status: timeOffType.requiresApproval ? 'PENDING' : 'APPROVED',
        approvedBy: timeOffType.requiresApproval ? null : req.user.id,
        approvedAt: timeOffType.requiresApproval ? null : new Date(),
    });

    // If auto-approved, deduct from allocation
    if (!timeOffType.requiresApproval && allocationId) {
        const allocation = await TimeOffAllocation.findByPk(allocationId);
        allocation.usedAmount = parseFloat(allocation.usedAmount) + duration;
        allocation.remainingAmount = allocation.calculateRemaining();
        await allocation.save();
    }

    res.status(201).json({
        success: true,
        message: timeOffType.requiresApproval ? 'Request submitted for approval' : 'Request approved automatically',
        data: request,
    });
});

/**
 * @desc    Get own requests (Employee)
 * @route   GET /api/time-off-requests/my-requests
 * @access  Private (Employee)
 */
export const getMyRequests = asyncHandler(async(req, res, next) => {
    const employee = await Employee.findOne({ where: { userId: req.user.id } });
    if (!employee) {
        throw new AppError('Employee record not found', 404);
    }

    const requests = await TimeOffRequest.findAll({
        where: { employeeId: employee.id },
        include: [{
            model: TimeOffType,
            as: 'timeOffType',
            attributes: ['id', 'name', 'code', 'unit'],
        }, ],
        order: [
            ['createdAt', 'DESC']
        ],
    });

    res.status(200).json({
        success: true,
        count: requests.length,
        data: requests,
    });
});

/**
 * @desc    Approve request (HR)
 * @route   PUT /api/time-off-requests/:id/approve
 * @access  Private (HR, Admin)
 */
export const approveRequest = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }

    if (request.status === 'APPROVED') {
        throw new AppError('Request already approved', 400);
    }

    if (request.status === 'CANCELLED') {
        throw new AppError('Cannot approve cancelled request', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        // Deduct from allocation if exists
        if (request.allocationId) {
            const allocation = await TimeOffAllocation.findByPk(request.allocationId, { transaction });

            if (!allocation) {
                throw new AppError('Allocation not found', 404);
            }

            const remaining = allocation.calculateRemaining();
            if (parseFloat(request.duration) > remaining) {
                throw new AppError(
                    `Insufficient balance. Available: ${remaining}, Requested: ${request.duration}`,
                    400
                );
            }

            allocation.usedAmount = parseFloat(allocation.usedAmount) + parseFloat(request.duration);
            allocation.remainingAmount = allocation.calculateRemaining();
            await allocation.save({ transaction });
        }

        // Update request
        request.status = 'APPROVED';
        request.approvedBy = req.user.id;
        request.approvedAt = new Date();
        await request.save({ transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Request approved successfully',
            data: request,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

/**
 * @desc    Refuse request (HR)
 * @route   PUT /api/time-off-requests/:id/refuse
 * @access  Private (HR, Admin)
 */
export const refuseRequest = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { refusalReason } = req.body;

    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }

    if (request.status === 'APPROVED') {
        throw new AppError('Cannot refuse approved request', 400);
    }

    request.status = 'REFUSED';
    request.refusalReason = refusalReason || 'Not specified';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();

    await request.save();

    res.status(200).json({
        success: true,
        message: 'Request refused successfully',
        data: request,
    });
});

/**
 * @desc    Cancel request (Employee)
 * @route   PUT /api/time-off-requests/:id/cancel
 * @access  Private (Employee)
 */
export const cancelRequest = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }

    if (request.status === 'CANCELLED') {
        throw new AppError('Request already cancelled', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        // Restore balance if request was approved
        if (request.status === 'APPROVED' && request.allocationId) {
            const allocation = await TimeOffAllocation.findByPk(request.allocationId, { transaction });

            if (allocation) {
                allocation.usedAmount = Math.max(
                    0,
                    parseFloat(allocation.usedAmount) - parseFloat(request.duration)
                );
                allocation.remainingAmount = allocation.calculateRemaining();
                await allocation.save({ transaction });
            }
        }

        request.status = 'CANCELLED';
        await request.save({ transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Request cancelled successfully',
            data: request,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});