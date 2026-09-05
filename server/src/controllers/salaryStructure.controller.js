import Sequelize from 'sequelize';
import SalaryStructure from '../models/salaryStructure.model.js';
import SalaryRule from '../models/salaryRule.model.js';
import SalaryStructureRule from '../models/salaryStructureRule.model.js';
import Contract from '../models/contract.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sequelize } from '../config/database.js';

const { Op } = Sequelize;

// ============ SALARY STRUCTURE CRUD ============

/**
 * @desc    Get all salary structures
 * @route   GET /api/salary-structures
 * @access  Private (HR Payroll, Admin)
 */
export const getAllSalaryStructures = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            search,
            active,
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

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await SalaryStructure.findAndCountAll({
        where,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [
            [sortBy, sortOrder]
        ],
        limit: parseInt(limit),
        offset,
        distinct: true,
    });

    // Get rule count and contract count for each structure
    const structuresWithDetails = await Promise.all(
        rows.map(async(structure) => {
            const ruleCount = await SalaryStructureRule.count({
                where: { salaryStructureId: structure.id, active: true },
            });
            const contractCount = await Contract.count({
                where: { salaryStructureId: structure.id, status: 'ACTIVE' },
            });
            return {
                ...structure.toJSON(),
                ruleCount,
                contractCount,
            };
        })
    );

    res.status(200).json({
        success: true,
        data: structuresWithDetails,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
        },
    });
});

/**
 * @desc    Get single salary structure with rules
 * @route   GET /api/salary-structures/:id
 * @access  Private
 */
export const getSalaryStructureById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const structure = await SalaryStructure.findByPk(id, {
        include: [{
            model: SalaryRule,
            as: 'rules',
            attributes: [
                'id',
                'name',
                'code',
                'category',
                'calculationType',
                'sequence',
                'fixedAmount',
                'percentage',
                'baseRuleCode',
                'formula',
                'active',
            ],
            through: {
                attributes: ['sequence'],
                where: { active: true },
            },
        }, ],
    });

    if (!structure) {
        throw new AppError('Salary structure not found', 404);
    }

    // Sort rules by sequence from through table
    const sortedRules = [...structure.rules].sort(
        (a, b) => (a.salaryStructureRule?.sequence ?? 0) - (b.salaryStructureRule?.sequence ?? 0)
    );

    res.status(200).json({
        success: true,
        data: {
            ...structure.toJSON(),
            rules: sortedRules,
        },
    });
});

/**
 * @desc    Create salary structure
 * @route   POST /api/salary-structures
 * @access  Private (HR Payroll Manager, Admin)
 */
export const createSalaryStructure = asyncHandler(async(req, res, next) => {
    const { name, code, description, ruleIds } = req.body;

    if (!name || !code) {
        throw new AppError('Please provide name and code', 400);
    }

    // Check if code exists
    const codeExists = await SalaryStructure.findOne({ where: { code } });
    if (codeExists) {
        throw new AppError('Salary structure code already exists', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        // Create structure
        const structure = await SalaryStructure.create({
            name,
            code,
            description,
            active: true,
        }, { transaction });

        // Add rules if provided
        if (ruleIds && Array.isArray(ruleIds) && ruleIds.length > 0) {
            for (let i = 0; i < ruleIds.length; i++) {
                await SalaryStructureRule.create({
                    salaryStructureId: structure.id,
                    salaryRuleId: ruleIds[i],
                    sequence: (i + 1) * 10,
                    active: true,
                }, { transaction });
            }
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Salary structure created successfully',
            data: structure,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

/**
 * @desc    Update salary structure
 * @route   PUT /api/salary-structures/:id
 * @access  Private (HR Payroll Manager, Admin)
 */
export const updateSalaryStructure = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
        throw new AppError('Salary structure not found', 404);
    }

    const { name, code, description, active } = req.body;

    if (code && code !== structure.code) {
        const codeExists = await SalaryStructure.findOne({
            where: { code, id: {
                    [Op.ne]: id } },
        });
        if (codeExists) {
            throw new AppError('Salary structure code already exists', 400);
        }
    }

    if (name) structure.name = name;
    if (code) structure.code = code;
    if (description !== undefined) structure.description = description;
    if (active !== undefined) structure.active = active;

    await structure.save();

    res.status(200).json({
        success: true,
        message: 'Salary structure updated successfully',
        data: structure,
    });
});

/**
 * @desc    Delete salary structure
 * @route   DELETE /api/salary-structures/:id
 * @access  Private (Admin only)
 */
export const deleteSalaryStructure = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
        throw new AppError('Salary structure not found', 404);
    }

    // Check if assigned to active contracts
    const contractCount = await Contract.count({
        where: { salaryStructureId: id, status: 'ACTIVE' },
    });

    if (contractCount > 0) {
        throw new AppError(
            `Cannot delete structure assigned to ${contractCount} active contract(s)`,
            400
        );
    }

    structure.active = false;
    await structure.save();

    res.status(200).json({
        success: true,
        message: 'Salary structure deactivated successfully',
    });
});

// ============ STRUCTURE RULES MANAGEMENT ============

/**
 * @desc    Add rules to salary structure
 * @route   POST /api/salary-structures/:id/rules
 * @access  Private (HR Payroll Manager, Admin)
 */
export const addRulesToStructure = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { ruleIds } = req.body;

    const structure = await SalaryStructure.findByPk(id);
    if (!structure) {
        throw new AppError('Salary structure not found', 404);
    }

    if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
        throw new AppError('Please provide ruleIds array', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        // Get current max sequence
        const maxSequenceRule = await SalaryStructureRule.findOne({
            where: { salaryStructureId: id },
            order: [
                ['sequence', 'DESC']
            ],
        });

        let nextSequence = maxSequenceRule ? maxSequenceRule.sequence + 10 : 10;

        for (const ruleId of ruleIds) {
            // Check if rule already added
            const existing = await SalaryStructureRule.findOne({
                where: { salaryStructureId: id, salaryRuleId: ruleId },
            });

            if (!existing) {
                await SalaryStructureRule.create({
                    salaryStructureId: id,
                    salaryRuleId: ruleId,
                    sequence: nextSequence,
                    active: true,
                }, { transaction });
                nextSequence += 10;
            }
        }

        await transaction.commit();

        const updatedStructure = await SalaryStructure.findByPk(id, {
            include: [{ model: SalaryRule, as: 'rules' }],
        });

        res.status(200).json({
            success: true,
            message: 'Rules added successfully',
            data: updatedStructure,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

/**
 * @desc    Remove rule from salary structure
 * @route   DELETE /api/salary-structures/:id/rules/:ruleId
 * @access  Private (HR Payroll Manager, Admin)
 */
export const removeRuleFromStructure = asyncHandler(async(req, res, next) => {
    const { id, ruleId } = req.params;

    const structureRule = await SalaryStructureRule.findOne({
        where: { salaryStructureId: id, salaryRuleId: ruleId },
    });

    if (!structureRule) {
        throw new AppError('Rule not found in structure', 404);
    }

    await structureRule.destroy();

    res.status(200).json({
        success: true,
        message: 'Rule removed from structure successfully',
    });
});

/**
 * @desc    Update rule sequence in structure
 * @route   PUT /api/salary-structures/:id/rules/reorder
 * @access  Private (HR Payroll Manager, Admin)
 */
export const reorderStructureRules = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { rules } = req.body;

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
        throw new AppError('Please provide rules array with ruleId and sequence', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        for (const item of rules) {
            await SalaryStructureRule.update({ sequence: item.sequence }, {
                where: {
                    salaryStructureId: id,
                    salaryRuleId: item.ruleId,
                },
                transaction,
            });
        }

        await transaction.commit();

        const updatedStructure = await SalaryStructure.findByPk(id, {
            include: [{ model: SalaryRule, as: 'rules' }],
        });

        res.status(200).json({
            success: true,
            message: 'Rules reordered successfully',
            data: updatedStructure,
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});