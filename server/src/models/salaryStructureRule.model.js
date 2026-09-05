import { Model, DataTypes } from 'sequelize';

export default class SalaryStructureRule extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            salaryStructureId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'salary_structure_id'
            },
            salaryRuleId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'salary_rule_id'
            },
            sequence: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 10
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
            }
        }, {
            sequelize,
            tableName: 'salary_structure_rules',
            timestamps: false,
            indexes: [{ unique: true, fields: ['salary_structure_id', 'salary_rule_id'] }]
        });
    }

    static associate(models) {
        this.belongsTo(models.SalaryStructure, { foreignKey: 'salaryStructureId', as: 'salaryStructure' });
        this.belongsTo(models.SalaryRule, { foreignKey: 'salaryRuleId', as: 'salaryRule' });
    }
}