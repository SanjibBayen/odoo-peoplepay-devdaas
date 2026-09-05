import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class TimeOffAllocation extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        employeeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'employee_id',
        },
        timeOffTypeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'time_off_type_id',
        },
        allocatedAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'allocated_amount',
        },
        usedAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'used_amount',
        },
        remainingAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: 'remaining_amount',
        },
        validFrom: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'valid_from',
        },
        validTo: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'valid_to',
        },
        status: {
          type: DataTypes.ENUM('DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'EXPIRED'),
          allowNull: false,
          defaultValue: 'DRAFT',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        approvedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'approved_by',
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'approved_at',
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
        tableName: 'time_off_allocations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    this.belongsTo(models.TimeOffType, { foreignKey: 'timeOffTypeId', as: 'timeOffType' });
    this.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    this.hasMany(models.TimeOffRequest, { foreignKey: 'allocationId', as: 'requests' });
  }

  calculateRemaining() {
    return parseFloat(this.allocatedAmount) - parseFloat(this.usedAmount);
  }
}
