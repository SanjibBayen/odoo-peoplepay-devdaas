import Sequelize from 'sequelize';

const { Model, DataTypes, Op } = Sequelize;

export default class Employee extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
          unique: true,
          field: 'user_id',
        },
        employeeCode: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          field: 'employee_code',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'first_name',
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'last_name',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING(30),
          allowNull: true,
        },
        dob: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        gender: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        joiningDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'joining_date',
        },
        leavingDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          field: 'leaving_date',
        },
        departmentId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'department_id',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'manager_id',
        },
        jobPositionId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'job_position_id',
        },
        employeeTypeId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'employee_type_id',
        },
        scheduleId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'schedule_id',
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'),
          allowNull: false,
          defaultValue: 'ACTIVE',
        },
        bankAccountNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'bank_account_number',
        },
        bankName: {
          type: DataTypes.STRING(150),
          allowNull: true,
          field: 'bank_name',
        },
        ifscCode: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'ifsc_code',
        },
        avatarUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'avatar_url',
        },
        emergencyContactName: {
          type: DataTypes.STRING(150),
          allowNull: true,
          field: 'emergency_contact_name',
        },
        emergencyContactPhone: {
          type: DataTypes.STRING(30),
          allowNull: true,
          field: 'emergency_contact_phone',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
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
        tableName: 'employees',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    this.belongsTo(this, { foreignKey: 'managerId', as: 'manager' });
    this.hasMany(this, { foreignKey: 'managerId', as: 'directReports' });
    this.belongsTo(models.JobPosition, { foreignKey: 'jobPositionId', as: 'jobPosition' });
    this.belongsTo(models.EmployeeType, { foreignKey: 'employeeTypeId', as: 'employeeType' });
    this.belongsTo(models.WorkSchedule, { foreignKey: 'scheduleId', as: 'schedule' });
    this.hasMany(models.Contract, { foreignKey: 'employeeId', as: 'contracts' });
    this.hasMany(models.Attendance, { foreignKey: 'employeeId', as: 'attendance' });
    this.hasMany(models.TimeOffAllocation, { foreignKey: 'employeeId', as: 'timeOffAllocations' });
    this.hasMany(models.TimeOffRequest, { foreignKey: 'employeeId', as: 'timeOffRequests' });
    this.hasMany(models.Payslip, { foreignKey: 'employeeId', as: 'payslips' });
  }

  get fullName() {
    return `${this.firstName} ${this.lastName || ''}`.trim();
  }

  async getActiveContract(asOfDate = new Date()) {
    const contracts = await this.getContracts({
      where: {
        status: 'ACTIVE',
        startDate: {
          [Op.lte]: asOfDate,
        },
        [Op.or]: [
          { endDate: null },
          {
            endDate: {
              [Op.gte]: asOfDate,
            },
          },
        ],
      },
    });
    if (contracts.length > 1) {
      throw new Error(`Multiple active contracts found for employee ${this.id}`);
    }
    return contracts[0] || null;
  }

  async getCurrentAllocation(timeOffTypeId) {
    const currentDate = new Date();
    const allocations = await this.getTimeOffAllocations({
      where: {
        timeOffTypeId,
        status: 'APPROVED',
        validFrom: {
          [Op.lte]: currentDate,
        },
        validTo: {
          [Op.gte]: currentDate,
        },
      },
    });
    return allocations[0] || null;
  }
}
