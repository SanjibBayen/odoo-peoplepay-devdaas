import Sequelize from 'sequelize';
import Payrun from '../models/payrun.model.js';
import PayrunEmployee from '../models/payrunEmployee.model.js';
import Payslip from '../models/payslip.model.js';
import PayslipLine from '../models/payslipLine.model.js';
import SalaryStructure from '../models/salaryStructure.model.js';
import Employee from '../models/employee.model.js';
import Contract from '../models/contract.model.js';
import TaxConfiguration from '../models/taxConfiguration.model.js';
import TaxSlab from '../models/taxSlab.model.js';
import PayrollWarning from '../models/payrollWarning.model.js';
import EmailDeliveryLog from '../models/emailDeliveryLog.model.js';
import Notification from '../models/notification.model.js';
import { notifyUser, notifyRole } from '../services/socket.service.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sequelize } from '../config/database.js';
import { sendBulkEmails } from '../utils/sendEmail.js';
import { payslipEmailTemplate } from '../utils/emailTemplates.js';

const { Op } = Sequelize;

// ============ TAX CALCULATION ENGINE ============

/**
 * Calculate progressive tax based on configuration
 * @param {number} annualIncome - Annual gross income
 * @param {Object} config - Tax configuration with slabs
 * @returns {Object} Tax calculation result
 */
const calculateProgressiveTax = (annualIncome, config) => {
    if (!config || !config.slabs || config.slabs.length === 0) {
        return {
            annualTax: 0,
            surcharge: 0,
            cess: 0,
            totalTax: 0,
            monthlyTDS: 0,
            breakdown: [],
        };
    }

    const slabs = config.slabs.sort((a, b) => a.sequence - b.sequence);
    let annualTax = 0;
    const breakdown = [];

    for (const slab of slabs) {
        const minIncome = parseFloat(slab.minIncome);
        const maxIncome = slab.maxIncome ? parseFloat(slab.maxIncome) : Infinity;
        const taxRate = parseFloat(slab.taxRate);

        if (annualIncome <= minIncome) break;

        const taxableInThisSlab = Math.min(annualIncome, maxIncome) - minIncome;
        const taxForSlab = taxableInThisSlab * (taxRate / 100);

        annualTax += taxForSlab;

        breakdown.push({
            slabRange: slab.maxIncome ? `${minIncome} - ${maxIncome}` : `${minIncome}+`,
            taxRate: `${taxRate}%`,
            taxableAmount: Math.round(taxableInThisSlab * 100) / 100,
            taxAmount: Math.round(taxForSlab * 100) / 100,
        });
    }

    // Calculate surcharge based on income
    let surcharge = 0;
    if (annualIncome > 5000000) {
        surcharge = annualTax * 0.15;
    } else if (annualIncome > 2000000) {
        surcharge = annualTax * 0.1;
    } else if (annualIncome > 1000000) {
        surcharge = annualTax * 0.1;
    }

    // Calculate cess (4% on tax + surcharge)
    const cess = (annualTax + surcharge) * 0.04;
    const totalTax = annualTax + surcharge + cess;

    return {
        annualTax: Math.round(annualTax * 100) / 100,
        surcharge: Math.round(surcharge * 100) / 100,
        cess: Math.round(cess * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        monthlyTDS: Math.round((totalTax / 12) * 100) / 100,
        breakdown,
    };
};

// ============ PAYRUN CREATION (WIZARD) ============

/**
 * @desc    Step 1: Create payrun (Scope/Period)
 * @route   POST /api/payruns
 * @access  Private (HR Payroll, Admin)
 */
export const createPayrun = asyncHandler(async(req, res, next) => {
    const { name, salaryStructureId, periodStart, periodEnd, notes } = req.body;

    if (!name || !salaryStructureId || !periodStart || !periodEnd) {
        throw new AppError('Please provide name, salaryStructureId, periodStart, and periodEnd', 400);
    }

    // Validate salary structure
    const structure = await SalaryStructure.findByPk(salaryStructureId);
    if (!structure) {
        throw new AppError('Salary structure not found', 404);
    }

    if (!structure.active) {
        throw new AppError('Salary structure is inactive', 400);
    }

    // Validate dates
    if (new Date(periodEnd) < new Date(periodStart)) {
        throw new AppError('periodEnd must be after periodStart', 400);
    }

    // Create payrun
    const payrun = await Payrun.create({
        name,
        salaryStructureId,
        periodStart,
        periodEnd,
        notes,
        createdBy: req.user.id,
        status: 'DRAFT',
    });

    res.status(201).json({
        success: true,
        message: 'Payrun created. Now select employees',
        data: payrun,
    });
});

/**
 * @desc    Step 2: Get eligible employees for payrun
 * @route   GET /api/payruns/:id/eligible-employees
 * @access  Private (HR Payroll, Admin)
 */
export const getEligibleEmployees = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    const eligibleEmployees = await payrun.getEligibleEmployees();

    // Check which are already added
    const existingPayrunEmployees = await PayrunEmployee.findAll({
        where: { payrunId: id },
    });

    const alreadyAddedIds = existingPayrunEmployees.map((pe) => pe.employeeId);

    const employeesWithStatus = eligibleEmployees.map((employee) => ({
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        departmentId: employee.departmentId,
        alreadyAdded: alreadyAddedIds.includes(employee.id),
        activeContract: employee.contracts?.[0]
            ? {
                contractNumber: employee.contracts[0].contractNumber,
                wage: parseFloat(employee.contracts[0].wage),
                wageType: employee.contracts[0].wageType,
            }
            : null,
    }));

    res.status(200).json({
        success: true,
        count: employeesWithStatus.length,
        data: employeesWithStatus,
    });
});

/**
 * @desc    Add employees to payrun
 * @route   POST /api/payruns/:id/employees
 * @access  Private (HR Payroll, Admin)
 */
export const addEmployeesToPayrun = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const { employeeIds } = req.body;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    if (payrun.status !== 'DRAFT') {
        throw new AppError('Cannot add employees to non-draft payrun', 400);
    }

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        throw new AppError('Please provide employeeIds array', 400);
    }

    const transaction = await sequelize.transaction();

    try {
        const addedEmployees = [];

        for (const employeeId of employeeIds) {
            const employee = await Employee.findByPk(employeeId);
            if (!employee) continue;

            const existing = await PayrunEmployee.findOne({
                where: { payrunId: id, employeeId },
            });

            if (existing) continue;

            await PayrunEmployee.create({
                payrunId: id,
                employeeId,
            }, { transaction });

            addedEmployees.push(employeeId);
        }

        payrun.employeeCount = await PayrunEmployee.count({
            where: { payrunId: id },
        });
        await payrun.save({ transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `${addedEmployees.length} employee(s) added to payrun`,
            data: {
                addedCount: addedEmployees.length,
                totalEmployees: payrun.employeeCount,
            },
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

// ============ PAYRUN PROCESSING ============

/**
 * @desc    Compute payrun (Generate payslips with tax)
 * @route   POST /api/payruns/:id/compute
 * @access  Private (HR Payroll, Admin)
 */
export const computePayrun = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    if (payrun.status !== 'DRAFT') {
        throw new AppError(`Cannot compute payrun with status: ${payrun.status}`, 400);
    }

    const payrunEmployees = await PayrunEmployee.findAll({
        where: { payrunId: id },
        include: [{ model: Employee, as: 'employee' }],
    });

    if (payrunEmployees.length === 0) {
        throw new AppError('No employees in this payrun. Please add employees first', 400);
    }

    // ============ TAX CONFIGURATION ============
    const taxConfig = await TaxConfiguration.findOne({
        where: {
            country: 'India',
            active: true,
        },
        include: [{
            model: TaxSlab,
            as: 'slabs',
            order: [
                ['sequence', 'ASC']
            ]
        }],
        order: [
            ['createdAt', 'DESC']
        ],
    });

    const transaction = await sequelize.transaction();

    try {
        payrun.status = 'COMPUTING';
        await payrun.save({ transaction });

        let totalGross = 0;
        let totalDeductions = 0;
        let totalTax = 0;
        let totalNet = 0;

        for (const pe of payrunEmployees) {
            const employee = pe.employee;

            // Get active contract for period
            const contract = await Contract.findOne({
                where: {
                    employeeId: employee.id,
                    status: 'ACTIVE',
                    startDate: {
                        [Op.lte]: payrun.periodEnd
                    },
                    [Op.or]: [
                        { endDate: null },
                        {
                            endDate: {
                                [Op.gte]: payrun.periodStart
                            }
                        },
                    ],
                },
                order: [
                    ['startDate', 'DESC']
                ],
                transaction,
            });

            if (!contract) {
                continue;
            }

            // Check for duplicate payslip
            const existingPayslip = await Payslip.findOne({
                where: {
                    employeeId: employee.id,
                    payrunId: id,
                },
                transaction,
            });

            if (existingPayslip) {
                continue;
            }

            // Get attendance for period
            const attendance = await sequelize.models.Attendance.findAll({
                where: {
                    employeeId: employee.id,
                    workDate: {
                        [Op.between]: [payrun.periodStart, payrun.periodEnd]
                    },
                },
                transaction,
            });

            const presentDays = attendance.filter((a) => ['PRESENT', 'LATE', 'OVERTIME'].includes(a.status)).length;
            const totalWorkingDays = attendance.length;
            const workedMinutes = attendance.reduce((sum, a) => sum + a.workedMinutes, 0);

            // Calculate salary components
            const monthlyWage = parseFloat(contract.wage);
            const basic = Math.round(monthlyWage * 0.4 * 100) / 100;
            const hra = Math.round(monthlyWage * 0.2 * 100) / 100;
            const allowances = Math.round((monthlyWage - basic - hra) * 100) / 100;
            const gross = monthlyWage;

            // Calculate PF (12% of basic)
            const pf = Math.round(basic * 0.12 * 100) / 100;

            // Calculate ESI (0.75% of gross)
            const esi = Math.round(gross * 0.0075 * 100) / 100;

            // Professional Tax
            const pt = 200;

            // ============ TAX CALCULATION ============
            const annualIncome = monthlyWage * 12;
            const taxResult = calculateProgressiveTax(annualIncome, taxConfig);
            const tds = taxResult.monthlyTDS;

            // Total deductions
            const totalDeductionsForEmployee = Math.round((pf + esi + pt + tds) * 100) / 100;

            // Net salary
            const netSalary = Math.round((gross - totalDeductionsForEmployee) * 100) / 100;

            // Generate payslip number
            const month = String(new Date(payrun.periodStart).getMonth() + 1).padStart(2, '0');
            const year = new Date(payrun.periodStart).getFullYear();
            const payslipCount =
                (await Payslip.count({ where: { periodStart: payrun.periodStart }, transaction })) + 1;
            const payslipNumber = `PS-${year}${month}-${employee.employeeCode}-${String(payslipCount).padStart(4, '0')}`;

            // Create payslip
            const payslip = await Payslip.create({
                payslipNumber,
                payrunId: id,
                employeeId: employee.id,
                contractId: contract.id,
                salaryStructureId: payrun.salaryStructureId,
                periodStart: payrun.periodStart,
                periodEnd: payrun.periodEnd,
                workedDays: presentDays,
                workedHours: Math.round((workedMinutes / 60) * 100) / 100,
                scheduledDays: totalWorkingDays,
                grossSalary: gross,
                totalAllowances: Math.round((hra + allowances) * 100) / 100,
                totalDeductions: totalDeductionsForEmployee,
                taxAmount: tds,
                netSalary,
                status: 'COMPUTED',
                computationLog: {
                    taxBreakdown: taxResult.breakdown,
                    annualIncome,
                    monthlyWage,
                    surcharge: taxResult.surcharge,
                    cess: taxResult.cess,
                    totalAnnualTax: taxResult.totalTax,
                },
            }, { transaction });

            // Create payslip lines
            const lines = [
                { ruleCode: 'BASIC', ruleName: 'Basic Salary', category: 'BASIC', sequence: 10, amount: basic },
                { ruleCode: 'HRA', ruleName: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 20, amount: hra },
                { ruleCode: 'ALLOWANCE', ruleName: 'Other Allowances', category: 'ALLOWANCE', sequence: 30, amount: allowances },
                { ruleCode: 'GROSS', ruleName: 'Gross Salary', category: 'GROSS', sequence: 40, amount: gross },
                { ruleCode: 'PF', ruleName: 'Provident Fund', category: 'CONTRIBUTION', sequence: 50, amount: pf },
                { ruleCode: 'ESI', ruleName: 'ESI Contribution', category: 'CONTRIBUTION', sequence: 60, amount: esi },
                { ruleCode: 'PT', ruleName: 'Professional Tax', category: 'DEDUCTION', sequence: 70, amount: pt },
                { ruleCode: 'TDS', ruleName: 'Income Tax (TDS)', category: 'TAX', sequence: 80, amount: tds },
                { ruleCode: 'DEDUCTIONS', ruleName: 'Total Deductions', category: 'DEDUCTION', sequence: 90, amount: totalDeductionsForEmployee },
                { ruleCode: 'NET', ruleName: 'Net Salary', category: 'NET', sequence: 100, amount: netSalary },
            ];

            for (const line of lines) {
                await PayslipLine.create({
                    payslipId: payslip.id,
                    ruleCode: line.ruleCode,
                    ruleName: line.ruleName,
                    category: line.category,
                    sequence: line.sequence,
                    amount: line.amount,
                }, { transaction });
            }

            // Update totals
            totalGross += gross;
            totalDeductions += totalDeductionsForEmployee;
            totalTax += tds;
            totalNet += netSalary;
        }

        // Update payrun totals
        payrun.totalGross = Math.round(totalGross * 100) / 100;
        payrun.totalDeductions = Math.round(totalDeductions * 100) / 100;
        payrun.totalTax = Math.round(totalTax * 100) / 100;
        payrun.totalNet = Math.round(totalNet * 100) / 100;
        payrun.status = 'COMPUTED';
        payrun.computedAt = new Date();
        await payrun.save({ transaction });

        await transaction.commit();

        // Generate warnings
        await payrun.validateWarnings();

        res.status(200).json({
            success: true,
            message: 'Payrun computed successfully',
            data: {
                payrunId: payrun.id,
                status: payrun.status,
                employeeCount: payrun.employeeCount,
                totalGross: payrun.totalGross,
                totalDeductions: payrun.totalDeductions,
                totalTax: payrun.totalTax,
                totalNet: payrun.totalNet,
            },
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

/**
 * @desc    Validate payrun
 * @route   POST /api/payruns/:id/validate
 * @access  Private (HR Payroll, Admin)
 */
export const validatePayrun = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    if (payrun.status !== 'COMPUTED') {
        throw new AppError(`Cannot validate payrun with status: ${payrun.status}`, 400);
    }

    const errorWarnings = await PayrollWarning.findAll({
        where: {
            payrunId: id,
            severity: {
                [Op.in]: ['ERROR', 'CRITICAL']
            },
            resolved: false,
        },
    });

    if (errorWarnings.length > 0) {
        throw new AppError(
            `Cannot validate: ${errorWarnings.length} unresolved error(s) found`,
            400
        );
    }

    await payrun.validate(req.user.id);

    // Notify HR Payroll Managers in real-time
    notifyRole('HR_PAYROLL_MANAGER', {
        title: 'Payrun Validated',
        message: `Payrun #${payrun.payrunNumber || payrun.id} has been validated and is ready for payment approval.`,
        type: 'SUCCESS',
        entityType: 'Payrun',
        entityId: payrun.id,
        route: `/payruns/${payrun.id}`,
    }).catch(() => null);

    res.status(200).json({
        success: true,
        message: 'Payrun validated successfully',
        data: payrun,
    });
});

/**
 * @desc    Mark payrun as paid
 * @route   POST /api/payruns/:id/mark-paid
 * @access  Private (HR Payroll Manager, Admin)
 */
export const markPayrunPaid = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    await payrun.markPaid(req.user.id);

    // Notify employees in real-time
    const payslips = await Payslip.findAll({
        where: { payrunId: id },
        include: [{ model: Employee, as: 'employee' }],
    });

    for (const payslip of payslips) {
        const employee = payslip.employee;
        if (employee?.userId) {
            await notifyUser({
                userId: employee.userId,
                title: 'Payslip Available',
                message: `Your payslip for ${payrun.periodStart} to ${payrun.periodEnd} is now available. Net Salary: ₹${payslip.netSalary}`,
                type: 'SUCCESS',
                entityType: 'payslip',
                entityId: payslip.id,
                route: `/payslips/${payslip.id}`,
            }).catch(() => null);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Payrun marked as paid successfully',
        data: payrun,
    });
});

// ============ PAYRUN QUERIES ============

/**
 * @desc    Get all payruns
 * @route   GET /api/payruns
 * @access  Private (HR Payroll, Admin)
 */
export const getAllPayruns = asyncHandler(async(req, res, next) => {
    const {
        page = 1,
            limit = 20,
            status,
            salaryStructureId,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
    } = req.query;

    const where = {};

    if (status) {
        where.status = status;
    }

    if (salaryStructureId) {
        where.salaryStructureId = salaryStructureId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Payrun.findAndCountAll({
        where,
        include: [{
            model: SalaryStructure,
            as: 'salaryStructure',
            attributes: ['id', 'name', 'code'],
        }, ],
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
 * @desc    Get single payrun with details
 * @route   GET /api/payruns/:id
 * @access  Private (HR Payroll, Admin)
 */
export const getPayrunById = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id, {
        include: [{
                model: SalaryStructure,
                as: 'salaryStructure',
                attributes: ['id', 'name', 'code'],
            },
            {
                model: Payslip,
                as: 'payslips',
                include: [{
                    model: Employee,
                    as: 'employee',
                    attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
                }, ],
            },
            {
                model: PayrollWarning,
                as: 'warnings',
                where: { resolved: false },
                required: false,
            },
        ],
    });

    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    res.status(200).json({
        success: true,
        data: payrun,
    });
});

/**
 * @desc    Get payrun warnings
 * @route   GET /api/payruns/:id/warnings
 * @access  Private (HR Payroll, Admin)
 */
export const getPayrunWarnings = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const warnings = await PayrollWarning.findAll({
        where: {
            payrunId: id,
            resolved: false,
        },
        include: [{
            model: Employee,
            as: 'employee',
            attributes: ['id', 'employeeCode', 'firstName', 'lastName'],
        }, ],
        order: [
            ['severity', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });

    res.status(200).json({
        success: true,
        count: warnings.length,
        data: warnings,
    });
});

/**
 * @desc    Send payslips by email
 * @route   POST /api/payruns/:id/send-payslips
 * @access  Private (HR Payroll Manager, Admin)
 */
export const sendPayslips = asyncHandler(async(req, res, next) => {
    const { id } = req.params;

    const payrun = await Payrun.findByPk(id);
    if (!payrun) {
        throw new AppError('Payrun not found', 404);
    }

    if (!['VALIDATED', 'PAID'].includes(payrun.status)) {
        throw new AppError(`Cannot send payslips for payrun with status: ${payrun.status}`, 400);
    }

    const payslips = await Payslip.findAll({
        where: { payrunId: id },
        include: [{
            model: Employee,
            as: 'employee',
        }, ],
    });

    if (payslips.length === 0) {
        throw new AppError('No payslips found in this payrun', 400);
    }

    const emailResults = [];
    const emailRecipients = [];

    for (const payslip of payslips) {
        const employee = payslip.employee;

        if (!employee?.email) {
            continue;
        }

        emailRecipients.push({
            email: employee.email,
            subject: `Payslip for ${payrun.periodStart} to ${payrun.periodEnd}`,
            html: payslipEmailTemplate(employee, payslip),
        });

        await EmailDeliveryLog.create({
            payrunId: id,
            payslipId: payslip.id,
            employeeId: employee.id,
            recipientEmail: employee.email,
            subject: `Payslip for ${payrun.periodStart} to ${payrun.periodEnd}`,
            status: 'QUEUED',
        });
    }

    const results = await sendBulkEmails(emailRecipients, 10);

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            emailResults.push({
                email: emailRecipients[index].email,
                status: 'SENT',
            });
        } else {
            emailResults.push({
                email: emailRecipients[index].email,
                status: 'FAILED',
            });
        }
    });

    await Payslip.update({
        emailSentAt: new Date(),
        emailSentTo: 'multiple',
    }, { where: { payrunId: id } });

    res.status(200).json({
        success: true,
        message: `Payslips sent to ${emailResults.length} employee(s)`,
        data: emailResults,
    });
});