import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class PayrollWarning extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        payrunId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'payrun_id',
        },
        payslipId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'payslip_id',
        },
        employeeId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'employee_id',
        },
        warningType: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'warning_type',
        },
        severity: {
          type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
          allowNull: false,
          defaultValue: 'WARNING',
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        resolved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        resolvedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'resolved_by',
        },
        resolvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'resolved_at',
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
        tableName: 'payroll_warnings',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Payrun, { foreignKey: 'payrunId', as: 'payrun' });
    this.belongsTo(models.Payslip, { foreignKey: 'payslipId', as: 'payslip' });
    this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    this.belongsTo(models.User, { foreignKey: 'resolvedBy', as: 'resolver' });
  }

  async resolve(userId) {
    this.resolved = true;
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    await this.save();
    return this;
  }
}
