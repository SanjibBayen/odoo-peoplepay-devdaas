import { Model, DataTypes } from 'sequelize';

export default class SalaryRule extends Model {
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
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            category: {
                type: DataTypes.ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'TAX', 'CONTRIBUTION', 'NET'),
                allowNull: false
            },
            calculationType: {
                type: DataTypes.ENUM('FIXED', 'PERCENTAGE', 'FORMULA', 'TAX'),
                allowNull: false,
                field: 'calculation_type'
            },
            sequence: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 10
            },
            fixedAmount: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                field: 'fixed_amount'
            },
            percentage: {
                type: DataTypes.DECIMAL(8, 4),
                allowNull: true
            },
            baseRuleCode: {
                type: DataTypes.STRING(50),
                allowNull: true,
                field: 'base_rule_code'
            },
            formula: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            conditionFormula: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'condition_formula'
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
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
            tableName: 'salary_rules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsToMany(models.SalaryStructure, {
            through: 'salary_structure_rules',
            foreignKey: 'salary_rule_id',
            otherKey: 'salary_structure_id',
            as: 'structures'
        });
        this.hasMany(models.PayslipLine, { foreignKey: 'salaryRuleId', as: 'payslipLines' });
    }

    calculate(employee, contract, payslip, context, attendanceData = null) {
        if (!this.active) return 0;

        switch (this.calculationType) {
            case 'FIXED':
                return parseFloat(this.fixedAmount || 0);

            case 'PERCENTAGE':
                if (this.baseRuleCode && context[this.baseRuleCode] !== undefined) {
                    const baseValue = context[this.baseRuleCode];
                    return baseValue * (parseFloat(this.percentage || 0) / 100);
                }
                return 0;

            case 'FORMULA':
                if (this.formula) {
                    try {
                        const vars = {
                            ...context,
                            employee,
                            contract,
                            payslip,
                            attendance: attendanceData || {}
                        };
                        // Secure evaluation - use a proper expression evaluator in production
                        const result = eval(this.formula);
                        return typeof result === 'number' ? result : 0;
                    } catch (error) {
                        return 0;
                    }
                }
                return 0;

            case 'TAX':
                return this.calculateTax(employee, contract, context);

            default:
                return 0;
        }
    }

    calculateTax(employee, contract, context) {
        const grossIncome = context['GROSS'] || 0;
        const annualIncome = grossIncome * 12;

        let tax = 0;
        const slabs = [
            { limit: 300000, rate: 0 },
            { limit: 300001, max: 600000, rate: 5 },
            { limit: 600001, max: 900000, rate: 10 },
            { limit: 900001, max: 1200000, rate: 15 },
            { limit: 1200001, max: 1500000, rate: 20 },
            { limit: 1500001, max: Infinity, rate: 30 }
        ];

        for (const slab of slabs) {
            if (annualIncome <= slab.limit) break;
            const taxable = Math.min(annualIncome, slab.max || Infinity) - slab.limit;
            tax += taxable * (slab.rate / 100);
        }

        return tax / 12;
    }
}