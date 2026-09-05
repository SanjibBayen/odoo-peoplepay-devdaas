import Sequelize from 'sequelize';
import Contract from '../models/contract.model.js';
import Employee from '../models/employee.model.js';
import Department from '../models/department.model.js';
import JobPosition from '../models/jobposition.model.js';
import WorkSchedule from '../models/workSchedule.model.js';
import SalaryStructure from '../models/salaryStructure.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ CONTRACT CRUD ============

/**
 * @desc    Get all contracts with filters
 * @route   GET /api/contracts
 * @access  Private (HR, Admin)
 */
export const getAllContracts = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 10,
            search,
            status,
            employeeId,
            departmentId,
            wageType,
            startDate,
            endDate,
            sortBy = 'startDate',
            sortOrder = 'DESC',
    } = req.query;

    // Build where clause
    const where = {};

    if (search) {
        where[Op.or] = [
            { contractNumber: {
                    [Op.iLike]: `%${search}%` } },
        ];
    }

    if (status) {
        where.status = status;
    }

    if (employeeId) {
        where.employeeId = employeeId;
    }

    if (departmentId) {
        where.departmentId = departmentId;
    }

    if (wageType) {
        where.wageType = wageType;
    }

    if (startDate) {
        where.startDate = {
            [Op.gte]: startDate };
    }

    if (endDate) {
        where.endDate = {
            [Op.lte]: endDate };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Contract.findAndCountAll({
        where,
        include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email'],
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
                model: WorkSchedule,
                as: 'schedule',
                attributes: ['id', 'name', 'code'],
            },
            {
                model: SalaryStructure,
                as: 'salaryStructure',
                attributes: ['id', 'name', 'code'],
            },
        ],
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
        },
        order: [
            [sortBy, sortOrder]
        ],
        limit: parseInt(limit),
        offset,
        distinct: true,
    });

    // Add isActive flag
    const contractsWithActiveFlag = rows.map((contract) => ({
        ...contract.toJSON(),
        isActiveNow: contract.isActiveOnDate(new Date()),
    }));

    res.status(200).json({
        success: true,
        data: contractsWithActiveFlag,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
        },
    });
});

/**
 * @desc    Get single contract by ID
 * @route   GET /api/contracts/:id
 * @access  Private
 */
export const getContractById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const contract = await Contract.findByPk(id, {
        include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email', 'status'],
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
                model: WorkSchedule,
                as: 'schedule',
                attributes: ['id', 'name', 'code', 'weeklyHours'],
            },
            {
                model: SalaryStructure,
                as: 'salaryStructure',
                attributes: ['id', 'name', 'code'],
            },
        ],
    });

    if (!contract) {
        throw new AppError('Contract not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            ...contract.toJSON(),
            isActiveNow: contract.isActiveOnDate(new Date()),
        },
    });
});

/**
 * @desc    Create new contract
 * @route   POST /api/contracts
 * @access  Private (HR, Admin)
 */
export const createContract = asyncHandler(async(req, res, next) => {
    const {
        employeeId,
        contractNumber,
        startDate,
        endDate,
        departmentId,
        jobPositionId,
        scheduleId,
        salaryStructureId,
        wage,
        wageType,
        status = 'DRAFT',
        trialEndDate,
        notes,
    } = req.body;

    // Validate required fields
    if (!employeeId || !contractNumber || !startDate || !wage) {
        throw new AppError(
            'Please provide employeeId, contractNumber, startDate, and wage',
            400
        );
    }

    // Validate wage
    if (parseFloat(wage) < 0) {
        throw new AppError('Wage cannot be negative', 400);
    }

    // Validate dates
    if (endDate && new Date(endDate) < new Date(startDate)) {
        throw new AppError('End date must be after start date', 400);
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    // Check if contract number exists
    const numberExists = await Contract.findOne({ where: { contractNumber } });
    if (numberExists) {
        throw new AppError('Contract number already exists', 400);
    }

    // Check for overlapping active contracts
    if (status === 'ACTIVE' || status === 'DRAFT') {
        const overlappingContract = await Contract.findOne({
            where: {
                employeeId,
                status: {
                    [Op.in]: ['ACTIVE', 'DRAFT'] },
                [Op.or]: [{
                        // New contract starts during existing contract
                        startDate: {
                            [Op.between]: [startDate, endDate || '9999-12-31'] },
                    },
                    {
                        // New contract ends during existing contract
                        endDate: {
                            [Op.between]: [startDate, endDate || '9999-12-31'] },
                    },
                    {
                        // New contract fully covers existing contract
                        [Op.and]: [
                            { startDate: {
                                    [Op.lte]: startDate } },
                            {
                                [Op.or]: [
                                    { endDate: null },
                                    { endDate: {
                                            [Op.gte]: endDate || '9999-12-31' } },
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        if (overlappingContract) {
            throw new AppError(
                `Contract overlap detected with existing contract ${overlappingContract.contractNumber}`,
                400
            );
        }
    }

    // Create contract
    const contract = await Contract.create({
        employeeId,
        contractNumber,
        startDate,
        endDate: endDate || null,
        departmentId: departmentId || employee.departmentId,
        jobPositionId: jobPositionId || employee.jobPositionId,
        scheduleId: scheduleId || employee.scheduleId,
        salaryStructureId: salaryStructureId || null,
        wage,
        wageType: wageType || 'MONTHLY',
        status,
        trialEndDate: trialEndDate || null,
        notes,
    });

    // If contract is ACTIVE, update employee's department/position/schedule
    if (status === 'ACTIVE') {
        if (departmentId) employee.departmentId = departmentId;
        if (jobPositionId) employee.jobPositionId = jobPositionId;
        if (scheduleId) employee.scheduleId = scheduleId;
        await employee.save();
    }

    res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract,
    });
});

/**
 * @desc    Update contract
 * @route   PUT /api/contracts/:id
 * @access  Private (HR, Admin)
 */
export const updateContract = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const contract = await Contract.findByPk(id);
    if (!contract) {
        throw new AppError('Contract not found', 404);
    }

    const {
        contractNumber,
        startDate,
        endDate,
        departmentId,
        jobPositionId,
        scheduleId,
        salaryStructureId,
        wage,
        wageType,
        status,
        trialEndDate,
        notes,
    } = req.body;

    // Check if contract number exists (excluding current)
    if (contractNumber && contractNumber !== contract.contractNumber) {
        const numberExists = await Contract.findOne({
            where: { contractNumber, id: {
                    [Op.ne]: id } },
        });
        if (numberExists) {
            throw new AppError('Contract number already exists', 400);
        }
    }

    // Validate dates
    const newStartDate = startDate || contract.startDate;
    const newEndDate = endDate !== undefined ? endDate : contract.endDate;

    if (newEndDate && new Date(newEndDate) < new Date(newStartDate)) {
        throw new AppError('End date must be after start date', 400);
    }

    // Check for overlapping contracts (if status is ACTIVE or DRAFT)
    if (status === 'ACTIVE' || status === 'DRAFT') {
        const overlappingContract = await Contract.findOne({
            where: {
                employeeId: contract.employeeId,
                id: {
                    [Op.ne]: id },
                status: {
                    [Op.in]: ['ACTIVE', 'DRAFT'] },
                [Op.or]: [{
                        startDate: {
                            [Op.between]: [newStartDate, newEndDate || '9999-12-31'] },
                    },
                    {
                        endDate: {
                            [Op.between]: [newStartDate, newEndDate || '9999-12-31'] },
                    },
                    {
                        [Op.and]: [
                            { startDate: {
                                    [Op.lte]: newStartDate } },
                            {
                                [Op.or]: [
                                    { endDate: null },
                                    { endDate: {
                                            [Op.gte]: newEndDate || '9999-12-31' } },
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        if (overlappingContract) {
            throw new AppError(
                `Contract overlap detected with existing contract ${overlappingContract.contractNumber}`,
                400
            );
        }
    }

    // Update fields
    if (contractNumber) contract.contractNumber = contractNumber;
    if (startDate) contract.startDate = startDate;
    if (endDate !== undefined) contract.endDate = endDate;
    if (departmentId !== undefined) contract.departmentId = departmentId;
    if (jobPositionId !== undefined) contract.jobPositionId = jobPositionId;
    if (scheduleId !== undefined) contract.scheduleId = scheduleId;
    if (salaryStructureId !== undefined) contract.salaryStructureId = salaryStructureId;
    if (wage !== undefined) contract.wage = wage;
    if (wageType) contract.wageType = wageType;
    if (status) contract.status = status;
    if (trialEndDate !== undefined) contract.trialEndDate = trialEndDate;
    if (notes !== undefined) contract.notes = notes;

    await contract.save();

    res.status(200).json({
        success: true,
        message: 'Contract updated successfully',
        data: contract,
    });
});

/**
 * @desc    Terminate contract
 * @route   POST /api/contracts/:id/terminate
 * @access  Private (HR, Admin)
 */
export const terminateContract = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { terminationDate, reason } = req.body;

    const contract = await Contract.findByPk(id);
    if (!contract) {
        throw new AppError('Contract not found', 404);
    }

    if (contract.status !== 'ACTIVE') {
        throw new AppError('Only active contracts can be terminated', 400);
    }

    contract.status = 'TERMINATED';
    contract.endDate = terminationDate || new Date();
    contract.notes = contract.notes ?
        `${contract.notes}\nTerminated: ${reason || 'No reason provided'}` :
        `Terminated: ${reason || 'No reason provided'}`;

    await contract.save();

    res.status(200).json({
        success: true,
        message: 'Contract terminated successfully',
        data: contract,
    });
});

/**
 * @desc    Activate contract
 * @route   POST /api/contracts/:id/activate
 * @access  Private (HR, Admin)
 */
export const activateContract = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const contract = await Contract.findByPk(id);
    if (!contract) {
        throw new AppError('Contract not found', 404);
    }

    if (contract.status === 'ACTIVE') {
        throw new AppError('Contract is already active', 400);
    }

    // Check for overlapping active contracts
    const overlappingContract = await Contract.findOne({
        where: {
            employeeId: contract.employeeId,
            id: {
                [Op.ne]: id },
            status: 'ACTIVE',
            [Op.or]: [{
                    startDate: {
                        [Op.between]: [contract.startDate, contract.endDate || '9999-12-31'] },
                },
                {
                    endDate: {
                        [Op.between]: [contract.startDate, contract.endDate || '9999-12-31'] },
                },
                {
                    [Op.and]: [
                        { startDate: {
                                [Op.lte]: contract.startDate } },
                        {
                            [Op.or]: [
                                { endDate: null },
                                { endDate: {
                                        [Op.gte]: contract.endDate || '9999-12-31' } },
                            ],
                        },
                    ],
                },
            ],
        },
    });

    if (overlappingContract) {
        throw new AppError(
            `Cannot activate. Overlap detected with contract ${overlappingContract.contractNumber}`,
            400
        );
    }

    contract.status = 'ACTIVE';
    await contract.save();

    // Update employee's department/position/schedule
    const employee = await Employee.findByPk(contract.employeeId);
    if (employee) {
        if (contract.departmentId) employee.departmentId = contract.departmentId;
        if (contract.jobPositionId) employee.jobPositionId = contract.jobPositionId;
        if (contract.scheduleId) employee.scheduleId = contract.scheduleId;
        await employee.save();
    }

    res.status(200).json({
        success: true,
        message: 'Contract activated successfully',
        data: contract,
    });
});

// ============ CONTRACT QUERIES ============

/**
 * @desc    Get contracts by employee
 * @route   GET /api/contracts/employee/:employeeId
 * @access  Private
 */
export const getContractsByEmployee = asyncHandler(async(req, res, next) => {
    const { employeeId } = req.params;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new AppError('Employee not found', 404);
    }

    const contracts = await Contract.findAll({
        where: { employeeId },
        include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'name'],
            },
            {
                model: SalaryStructure,
                as: 'salaryStructure',
                attributes: ['id', 'name', 'code'],
            },
        ],
        order: [
            ['startDate', 'DESC']
        ],
    });

    res.status(200).json({
        success: true,
        count: contracts.length,
        data: contracts,
    });
});

/**
 * @desc    Get active contract for employee
 * @route   GET /api/contracts/active/:employeeId
 * @access  Private
 */
export const getActiveContract = asyncHandler(async(req, res, next) => {
    const { employeeId } = req.params;
    const { date } = req.query;

    const checkDate = date ? new Date(date) : new Date();

    const contract = await Contract.findOne({
        where: {
            employeeId,
            status: 'ACTIVE',
            startDate: {
                [Op.lte]: checkDate },
            [Op.or]: [
                { endDate: null },
                { endDate: {
                        [Op.gte]: checkDate } },
            ],
        },
        include: [{
                model: SalaryStructure,
                as: 'salaryStructure',
                attributes: ['id', 'name', 'code'],
            },
            {
                model: Department,
                as: 'department',
                attributes: ['id', 'name'],
            },
        ],
        order: [
            ['startDate', 'DESC']
        ],
    });

    res.status(200).json({
        success: true,
        data: contract || null,
    });
});