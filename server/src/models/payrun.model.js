import { Model, DataTypes, Op } from 'sequelize';

export default class Payrun extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING(150),
                allowNull: false
            },
            salaryStructureId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'salary_structure_id'
            },
            periodStart: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'period_start'
            },
            periodEnd: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'period_end'
            },
            status: {
                type: DataTypes.ENUM('DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'DRAFT'
            },
            employeeCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'employee_count'
            },
            totalGross: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_gross'
            },
            totalDeductions: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_deductions'
            },
            totalTax: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_tax'
            },
            totalNet: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_net'
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            createdBy: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'created_by'
            },
            computedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'computed_at'
            },
            validatedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'validated_at'
            },
            validatedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'validated_by'
            },
            paidAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'paid_at'
            },
            paidBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'paid_by'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'updated_at'
            }
        }, {
            sequelize,
            tableName: 'payruns',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsTo(models.SalaryStructure, { foreignKey: 'salaryStructureId', as: 'salaryStructure' });
        this.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
        this.belongsTo(models.User, { foreignKey: 'validatedBy', as: 'validator' });
        this.belongsTo(models.User, { foreignKey: 'paidBy', as: 'payer' });
        this.hasMany(models.PayrunEmployee, { foreignKey: 'payrunId', as: 'payrunEmployees' });
        this.hasMany(models.Payslip, { foreignKey: 'payrunId', as: 'payslips' });
        this.hasMany(models.PayrollWarning, { foreignKey: 'payrunId', as: 'warnings' });
    }

    async compute() {
        const payslips = await this.getPayslips({ where: { status: 'DRAFT' } });

        this.status = 'COMPUTING';
        await this.save();

        let totalGross = 0,
            totalDeductions = 0,
            totalTax = 0,
            totalNet = 0;

        for (const payslip of payslips) {
            await payslip.compute();
            totalGross += parseFloat(payslip.grossSalary);
            totalDeductions += parseFloat(payslip.totalDeductions);
            totalTax += parseFloat(payslip.taxAmount);
            totalNet += parseFloat(payslip.netSalary);
        }

        this.totalGross = totalGross;
        this.totalDeductions = totalDeductions;
        this.totalTax = totalTax;
        this.totalNet = totalNet;
        this.status = 'COMPUTED';
        this.computedAt = new Date();
        await this.save();

        await this.validateWarnings();

        return this;
    }

    async validateWarnings() {
        const warnings = [];
        const payrunEmployees = await this.getPayrunEmployees({ include: ['employee'] });

        for (const pe of payrunEmployees) {
            const employee = pe.employee;

            if (!employee.bankAccountNumber) {
                warnings.push({
                    payrunId: this.id,
                    employeeId: employee.id,
                    warningType: 'MISSING_BANK_DETAILS',
                    severity: 'WARNING',
                    message: `Employee ${employee.employeeCode} has no bank account details.`
                });
            }

            const duplicateExists = await this.sequelize.models.Payslip.findOne({
                where: {
                    employeeId: employee.id,
                    periodStart: this.periodStart,
                    periodEnd: this.periodEnd,
                    status: 'PAID'
                }
            });

            if (duplicateExists) {
                warnings.push({
                    payrunId: this.id,
                    employeeId: employee.id,
                    warningType: 'DUPLICATE_PAYSLIP',
                    severity: 'ERROR',
                    message: `Employee ${employee.employeeCode} already has a PAID payslip for this period.`
                });
            }

            const activeContract = await this.sequelize.models.Contract.findOne({
                where: {
                    employeeId: employee.id,
                    status: 'ACTIVE',
                    startDate: {
                        [Op.lte]: this.periodEnd },
                    [Op.or]: [
                        { endDate: null },
                        { endDate: {
                                [Op.gte]: this.periodStart } }
                    ]
                }
            });

            if (!activeContract) {
                warnings.push({
                    payrunId: this.id,
                    employeeId: employee.id,
                    warningType: 'MISSING_CONTRACT',
                    severity: 'ERROR',
                    message: `Employee ${employee.employeeCode} has no active contract for this period.`
                });
            }
        }

        if (warnings.length > 0) {
            await this.sequelize.models.PayrollWarning.bulkCreate(warnings);
        }

        return warnings;
    }

    async validate(userId) {
        const warnings = await this.validateWarnings();
        const errors = warnings.filter(w => w.severity === 'ERROR' || w.severity === 'CRITICAL');

        if (errors.length > 0) {
            throw new Error(`Cannot validate: ${errors.length} errors found. Please resolve them first.`);
        }

        this.status = 'VALIDATED';
        this.validatedAt = new Date();
        this.validatedBy = userId;
        await this.save();

        await this.sequelize.models.Payslip.update({ status: 'VALIDATED' }, { where: { payrunId: this.id } });

        return this;
    }

    async markPaid(userId) {
        if (this.status !== 'VALIDATED' && this.status !== 'COMPUTED') {
            throw new Error(`Cannot mark as paid: Status must be VALIDATED or COMPUTED. Current: ${this.status}`);
        }

        this.status = 'PAID';
        this.paidAt = new Date();
        this.paidBy = userId;
        await this.save();

        await this.sequelize.models.Payslip.update({ status: 'PAID', paidAt: new Date() }, { where: { payrunId: this.id } });

        return this;
    }

    async getEligibleEmployees() {
        const employees = await this.sequelize.models.Employee.findAll({
            where: { status: 'ACTIVE' },
            include: [{
                model: this.sequelize.models.Contract,
                as: 'contracts',
                where: {
                    status: 'ACTIVE',
                    startDate: {
                        [Op.lte]: this.periodEnd },
                    [Op.or]: [
                        { endDate: null },
                        { endDate: {
                                [Op.gte]: this.periodStart } }
                    ]
                }
            }]
        });

        return employees;
    }
}