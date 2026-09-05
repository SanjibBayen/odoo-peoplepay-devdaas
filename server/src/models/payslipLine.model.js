import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class PayslipLine extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        payslipId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'payslip_id',
        },
        salaryRuleId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'salary_rule_id',
        },
        ruleCode: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'rule_code',
        },
        ruleName: {
          type: DataTypes.STRING(150),
          allowNull: false,
          field: 'rule_name',
        },
        category: {
          type: DataTypes.ENUM(
            'BASIC',
            'ALLOWANCE',
            'GROSS',
            'DEDUCTION',
            'TAX',
            'CONTRIBUTION',
            'NET'
          ),
          allowNull: false,
        },
        sequence: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 10,
        },
        baseAmount: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'base_amount',
        },
        percentage: {
          type: DataTypes.DECIMAL(8, 4),
          allowNull: true,
        },
        amount: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: false,
          defaultValue: 0,
        },
        formulaUsed: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'formula_used',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
      },
      {
        sequelize,
        tableName: 'payslip_lines',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Payslip, { foreignKey: 'payslipId', as: 'payslip' });
    this.belongsTo(models.SalaryRule, { foreignKey: 'salaryRuleId', as: 'salaryRule' });
  }
}
