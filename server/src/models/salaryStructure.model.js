import { Model, DataTypes } from 'sequelize';

export default class SalaryStructure extends Model {
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
            tableName: 'salary_structures',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsToMany(models.SalaryRule, {
            through: 'salary_structure_rules',
            foreignKey: 'salary_structure_id',
            otherKey: 'salary_rule_id',
            as: 'rules'
        });
        this.hasMany(models.Contract, { foreignKey: 'salaryStructureId', as: 'contracts' });
        this.hasMany(models.Payrun, { foreignKey: 'salaryStructureId', as: 'payruns' });
    }

    async getOrderedRules() {
        const rules = await this.getRules({
            through: { attributes: ['sequence'] },
            order: [
                [{ model: this.sequelize.models.SalaryStructureRule, as: 'salaryStructureRule' }, 'sequence', 'ASC']
            ]
        });
        return rules;
    }

    calculateGross(values) {
        let gross = 0;
        const rules = this.rules || [];
        const sortedRules = rules.sort((a, b) => a.salaryStructureRule?.sequence - b.salaryStructureRule?.sequence || 0);
        for (const rule of sortedRules) {
            if (['BASIC', 'ALLOWANCE', 'GROSS'].includes(rule.category)) {
                gross += values[rule.code] || 0;
            }
        }
        return gross;
    }

    calculateDeductions(values) {
        let deductions = 0;
        const rules = this.rules || [];
        const sortedRules = rules.sort((a, b) => a.salaryStructureRule?.sequence - b.salaryStructureRule?.sequence || 0);
        for (const rule of sortedRules) {
            if (['DEDUCTION', 'TAX', 'CONTRIBUTION'].includes(rule.category)) {
                deductions += values[rule.code] || 0;
            }
        }
        return deductions;
    }
};