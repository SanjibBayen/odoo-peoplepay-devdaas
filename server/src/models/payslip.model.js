import { Model, DataTypes } from 'sequelize';

export default class Payslip extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            payslipNumber: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                field: 'payslip_number'
            },
            payrunId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'payrun_id'
            },
            employeeId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'employee_id'
            },
            contractId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'contract_id'
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
            workedDays: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'worked_days'
            },
            workedHours: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'worked_hours'
            },
            scheduledDays: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'scheduled_days'
            },
            grossSalary: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'gross_salary'
            },
            totalAllowances: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_allowances'
            },
            totalDeductions: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'total_deductions'
            },
            taxAmount: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'tax_amount'
            },
            netSalary: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'net_salary'
            },
            status: {
                type: DataTypes.ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'DRAFT'
            },
            pdfUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'pdf_url'
            },
            pdfGeneratedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'pdf_generated_at'
            },
            emailSentAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'email_sent_at'
            },
            emailSentTo: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'email_sent_to'
            },
            computationLog: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'computation_log'
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
            tableName: 'payslips',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ unique: true, fields: ['employee_id', 'payrun_id'] }]
        });
    }

    static associate(models) {
        this.belongsTo(models.Payrun, { foreignKey: 'payrunId', as: 'payrun' });
        this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
        this.belongsTo(models.Contract, { foreignKey: 'contractId', as: 'contract' });
        this.belongsTo(models.SalaryStructure, { foreignKey: 'salaryStructureId', as: 'salaryStructure' });
        this.hasMany(models.PayslipLine, { foreignKey: 'payslipId', as: 'lines' });
    }

    async compute() {
        const structure = await this.getSalaryStructure();
        if (!structure) {
            throw new Error('Salary structure not found');
        }

        const rules = await structure.getOrderedRules();
        const contract = await this.getContract();
        const employee = await this.getEmployee();
        const processedValues = {};

        const attendance = await this.sequelize.models.Attendance.findAll({
            where: {
                employeeId: this.employeeId,
                workDate: {
                    [this.sequelize.Op.between]: [this.periodStart, this.periodEnd]
                }
            }
        });

        const attendanceData = {
            presentDays: attendance.filter(a => a.status === 'PRESENT').length,
            lateDays: attendance.filter(a => a.status === 'LATE').length,
            absentDays: attendance.filter(a => a.status === 'ABSENT').length,
            overtimeMinutes: attendance.reduce((sum, a) => sum + a.overtimeMinutes, 0),
            workedMinutes: attendance.reduce((sum, a) => sum + a.workedMinutes, 0),
            totalDays: attendance.length
        };

        for (const rule of rules) {
            const value = rule.calculate(employee, contract, this, processedValues, attendanceData);
            processedValues[rule.code] = value;

            await this.sequelize.models.PayslipLine.create({
                payslipId: this.id,
                salaryRuleId: rule.id,
                ruleCode: rule.code,
                ruleName: rule.name,
                category: rule.category,
                sequence: rule.sequence,
                baseAmount: processedValues[rule.baseRuleCode] || 0,
                percentage: rule.percentage,
                amount: value,
                formulaUsed: rule.formula
            });
        }

        const grossRules = rules.filter(r => ['BASIC', 'ALLOWANCE', 'GROSS'].includes(r.category));
        const deductionRules = rules.filter(r => ['DEDUCTION', 'TAX', 'CONTRIBUTION'].includes(r.category));
        const allowanceRules = rules.filter(r => r.category === 'ALLOWANCE');
        const taxRules = rules.filter(r => r.category === 'TAX');

        this.grossSalary = grossRules.reduce((sum, r) => sum + (processedValues[r.code] || 0), 0);
        this.totalAllowances = allowanceRules.reduce((sum, r) => sum + (processedValues[r.code] || 0), 0);
        this.totalDeductions = deductionRules.reduce((sum, r) => sum + (processedValues[r.code] || 0), 0);
        this.taxAmount = taxRules.reduce((sum, r) => sum + (processedValues[r.code] || 0), 0);
        this.netSalary = this.grossSalary - this.totalDeductions;

        this.workedDays = attendanceData.presentDays || 0;
        this.workedHours = attendanceData.workedMinutes / 60 || 0;
        this.scheduledDays = (this.periodEnd - this.periodStart) / (1000 * 60 * 60 * 24) + 1;

        this.status = 'COMPUTED';
        this.computationLog = processedValues;
        await this.save();

        return this;
    }

    async generatePayslipNumber() {
        const employee = await this.getEmployee();
        const month = String(this.periodStart.getMonth() + 1).padStart(2, '0');
        const year = this.periodStart.getFullYear();
        const count = await this.sequelize.models.Payslip.count({
            where: { periodStart: this.periodStart }
        }) + 1;
        this.payslipNumber = `PS-${year}${month}-${employee.employeeCode}-${String(count).padStart(4, '0')}`;
        await this.save();
        return this.payslipNumber;
    }

    toJSON() {
        const json = super.toJSON();
        return {
            ...json,
            grossSalary: parseFloat(json.grossSalary),
            totalDeductions: parseFloat(json.totalDeductions),
            taxAmount: parseFloat(json.taxAmount),
            netSalary: parseFloat(json.netSalary)
        };
    }
}