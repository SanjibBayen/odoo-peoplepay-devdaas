import Sequelize from 'sequelize';
import SalaryRule from '../models/salaryRule.model.js';
import SalaryStructure from '../models/salaryStructure.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

const { Op } = Sequelize;

// ============ SALARY RULE CRUD ============

/**
 * @desc    Get all salary rules
 * @route   GET /api/salary-rules
 * @access  Private (HR Payroll, Admin)
 */
export const getAllSalaryRules = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            search,
            category,
            calculationType,
            active,
            sortBy = 'sequence',
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

    if (category) {
        where.category = category;
    }

    if (calculationType) {
        where.calculationType = calculationType;
    }

    if (active !== undefined) {
        where.active = active === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await SalaryRule.findAndCountAll({
        where,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [
            [sortBy, sortOrder]
        ],
        limit: parseInt(limit),
        offset,
        distinct: true,
    });

    // Get structure count for each rule
    const rulesWithDetails = await Promise.all(
        rows.map(async(rule) => {
            const structureCount = await rule.countStructures();
            return {
                ...rule.toJSON(),
                structureCount,
            };
        })
    );

    res.status(200).json({
        success: true,
        data: rulesWithDetails,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
        },
    });
});

/**
 * @desc    Get single salary rule
 * @route   GET /api/salary-rules/:id
 * @access  Private
 */
export const getSalaryRuleById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const rule = await SalaryRule.findByPk(id, {
        include: [{
            model: SalaryStructure,
            as: 'structures',
            attributes: ['id', 'name', 'code'],
            through: { attributes: ['sequence'] },
        }, ],
    });

    if (!rule) {
        throw new AppError('Salary rule not found', 404);
    }

    res.status(200).json({
        success: true,
        data: rule,
    });
});

/**
 * @desc    Create salary rule
 * @route   POST /api/salary-rules
 * @access  Private (HR Payroll Manager, Admin)
 */
export const createSalaryRule = asyncHandler(async(req, res, next) => {
    const {
        name,
        code,
        description,
        category,
        calculationType,
        sequence,
        fixedAmount,
        percentage,
        baseRuleCode,
        formula,
        conditionFormula,
    } = req.body;

    if (!name || !code || !category || !calculationType) {
        throw new AppError('Please provide name, code, category, and calculationType', 400);
    }

    // Check if code exists
    const codeExists = await SalaryRule.findOne({ where: { code } });
    if (codeExists) {
        throw new AppError('Salary rule code already exists', 400);
    }

    // Validate calculation type specific fields
    if (calculationType === 'FIXED' && fixedAmount === undefined) {
        throw new AppError('Fixed amount is required for FIXED calculation type', 400);
    }

    if (calculationType === 'PERCENTAGE' && (percentage === undefined || !baseRuleCode)) {
        throw new AppError('Percentage and baseRuleCode are required for PERCENTAGE calculation type', 400);
    }

    if (calculationType === 'FORMULA' && !formula) {
        throw new AppError('Formula is required for FORMULA calculation type', 400);
    }

    const rule = await SalaryRule.create({
        name,
        code,
        description,
        category,
        calculationType,
        sequence: sequence || 10,
        fixedAmount,
        percentage,
        baseRuleCode,
        formula,
        conditionFormula,
        active: true,
    });

    res.status(201).json({
        success: true,
        message: 'Salary rule created successfully',
        data: rule,
    });
});

/**
 * @desc    Update salary rule
 * @route   PUT /api/salary-rules/:id
 * @access  Private (HR Payroll Manager, Admin)
 */
export const updateSalaryRule = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const rule = await SalaryRule.findByPk(id);
    if (!rule) {
        throw new AppError('Salary rule not found', 404);
    }

    const {
        name,
        code,
        description,
        category,
        calculationType,
        sequence,
        fixedAmount,
        percentage,
        baseRuleCode,
        formula,
        conditionFormula,
        active,
    } = req.body;

    if (code && code !== rule.code) {
        const codeExists = await SalaryRule.findOne({
            where: { code, id: {
                    [Op.ne]: id } },
        });
        if (codeExists) {
            throw new AppError('Salary rule code already exists', 400);
        }
    }

    if (name) rule.name = name;
    if (code) rule.code = code;
    if (description !== undefined) rule.description = description;
    if (category) rule.category = category;
    if (calculationType) rule.calculationType = calculationType;
    if (sequence !== undefined) rule.sequence = sequence;
    if (fixedAmount !== undefined) rule.fixedAmount = fixedAmount;
    if (percentage !== undefined) rule.percentage = percentage;
    if (baseRuleCode !== undefined) rule.baseRuleCode = baseRuleCode;
    if (formula !== undefined) rule.formula = formula;
    if (conditionFormula !== undefined) rule.conditionFormula = conditionFormula;
    if (active !== undefined) rule.active = active;

    await rule.save();

    res.status(200).json({
        success: true,
        message: 'Salary rule updated successfully',
        data: rule,
    });
});

/**
 * @desc    Delete salary rule
 * @route   DELETE /api/salary-rules/:id
 * @access  Private (Admin only)
 */
export const deleteSalaryRule = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const rule = await SalaryRule.findByPk(id);
    if (!rule) {
        throw new AppError('Salary rule not found', 404);
    }

    // Check if used in any structure
    const structureCount = await rule.countStructures();
    if (structureCount > 0) {
        throw new AppError(
            `Cannot delete rule used in ${structureCount} salary structure(s)`,
            400
        );
    }

    rule.active = false;
    await rule.save();

    res.status(200).json({
        success: true,
        message: 'Salary rule deactivated successfully',
    });
});

/**
 * @desc    Get rules by category
 * @route   GET /api/salary-rules/category/:category
 * @access  Private
 */
export const getRulesByCategory = asyncHandler(async(req, res, next) => {
    const { category } = req.params;

    const rules = await SalaryRule.findAll({
        where: {
            category,
            active: true,
        },
        attributes: ['id', 'name', 'code', 'category', 'calculationType', 'sequence'],
        order: [
            ['sequence', 'ASC']
        ],
    });

    res.status(200).json({
        success: true,
        count: rules.length,
        data: rules,
    });
});