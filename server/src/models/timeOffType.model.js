import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class TimeOffType extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        unit: {
          type: DataTypes.ENUM('DAYS', 'HOURS'),
          allowNull: false,
          defaultValue: 'DAYS',
        },
        requiresAllocation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'requires_allocation',
        },
        requiresApproval: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'requires_approval',
        },
        approvalMode: {
          type: DataTypes.ENUM('NO_APPROVAL', 'MANAGER_APPROVAL', 'HR_APPROVAL', 'BOTH_APPROVAL'),
          allowNull: false,
          defaultValue: 'MANAGER_APPROVAL',
          field: 'approval_mode',
        },
        payrollIntegration: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'payroll_integration',
        },
        isPaid: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_paid',
        },
        maxDaysPerRequest: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_days_per_request',
        },
        maxDaysPerYear: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_days_per_year',
        },
        carryForward: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'carry_forward',
        },
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'time_off_types',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    this.hasMany(models.TimeOffAllocation, { foreignKey: 'timeOffTypeId', as: 'allocations' });
    this.hasMany(models.TimeOffRequest, { foreignKey: 'timeOffTypeId', as: 'requests' });
  }
}
