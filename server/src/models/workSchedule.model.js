import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class WorkSchedule extends Model {
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
          validate: {
            notEmpty: true,
            len: [2, 150],
          },
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [2, 50],
          },
          set(value) {
            this.setDataValue('code', value.toUpperCase().replace(/\s+/g, '_'));
          },
        },
        scheduleType: {
          type: DataTypes.ENUM('WEEKLY', 'FLEXIBLE', 'SHIFT'),
          allowNull: false,
          defaultValue: 'WEEKLY',
          field: 'schedule_type',
          validate: {
            isIn: [['WEEKLY', 'FLEXIBLE', 'SHIFT']],
          },
        },
        weeklyHours: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'weekly_hours',
          validate: {
            min: 0,
            max: 168, // Maximum hours in a week
            isDecimal: true,
          },
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
        tableName: 'working_schedules',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { unique: true, fields: ['code'] },
          { fields: ['schedule_type'] },
          { fields: ['active'] },
        ],
        scopes: {
          active: {
            where: { active: true },
          },
          weekly: {
            where: { scheduleType: 'WEEKLY' },
          },
          flexible: {
            where: { scheduleType: 'FLEXIBLE' },
          },
          shift: {
            where: { scheduleType: 'SHIFT' },
          },
          withDays: {
            include: [
              {
                model: sequelize.models.ScheduleDay,
                as: 'scheduleDays',
                separate: true,
                order: [['day_of_week', 'ASC']],
              },
            ],
          },
        },
        hooks: {
          beforeDestroy: async (schedule) => {
            // Check if schedule is assigned to employees or contracts
            const employeeCount = await schedule.countEmployees();
            if (employeeCount > 0) {
              throw new Error(`Cannot delete schedule assigned to ${employeeCount} employee(s)`);
            }

            const contractCount = await schedule.countContracts();
            if (contractCount > 0) {
              throw new Error(`Cannot delete schedule assigned to ${contractCount} contract(s)`);
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.hasMany(models.ScheduleDay, {
      foreignKey: 'scheduleId',
      as: 'scheduleDays',
      onDelete: 'CASCADE',
    });

    this.hasMany(models.Employee, {
      foreignKey: 'scheduleId',
      as: 'employees',
    });

    this.hasMany(models.Contract, {
      foreignKey: 'scheduleId',
      as: 'contracts',
    });
  }

  // Instance methods
  async recalculateWeeklyHours() {
    const days = await this.getScheduleDays({
      where: { isWorkingDay: true },
    });

    if (!days || days.length === 0) {
      this.weeklyHours = 0;
    } else {
      const totalHours = days.reduce((total, day) => {
        return total + day.calculateWorkingHours();
      }, 0);

      this.weeklyHours = Math.round(totalHours * 100) / 100;
    }

    await this.save({ hooks: false });
    return this.weeklyHours;
  }

  async getScheduleForDay(dayOfWeek) {
    return this.getScheduleDays({
      where: { dayOfWeek },
    });
  }

  async getWorkingDays() {
    return this.getScheduleDays({
      where: { isWorkingDay: true },
      order: [['dayOfWeek', 'ASC']],
    });
  }

  async getNonWorkingDays() {
    return this.getScheduleDays({
      where: { isWorkingDay: false },
      order: [['dayOfWeek', 'ASC']],
    });
  }

  async isWorkingDay(dayOfWeek) {
    const day = await this.getScheduleDays({
      where: { dayOfWeek },
    });
    return day.length > 0 && day[0].isWorkingDay;
  }

  async getScheduleOverview() {
    const days = await this.getScheduleDays({
      order: [['dayOfWeek', 'ASC']],
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      dayName: dayNames[day.dayOfWeek],
      isWorkingDay: day.isWorkingDay,
      startTime: day.startTime,
      endTime: day.endTime,
      breakMinutes: day.breakMinutes,
      workingHours: day.calculateWorkingHours(),
    }));
  }

  async duplicateSchedule(newName, newCode) {
    const { WorkSchedule, ScheduleDay } = this.sequelize.models;

    // Create new schedule
    const newSchedule = await WorkSchedule.create({
      name: newName,
      code: newCode,
      scheduleType: this.scheduleType,
      weeklyHours: this.weeklyHours,
      active: true,
    });

    // Copy schedule days
    const days = await this.getScheduleDays();
    const dayPromises = days.map((day) =>
      ScheduleDay.create({
        scheduleId: newSchedule.id,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        breakMinutes: day.breakMinutes,
        isWorkingDay: day.isWorkingDay,
      })
    );

    await Promise.all(dayPromises);
    return newSchedule;
  }

  async getAssignedEmployeeCount() {
    return this.countEmployees({
      where: { status: 'ACTIVE' },
    });
  }

  async deactivate() {
    const activeEmployees = await this.getAssignedEmployeeCount();
    if (activeEmployees > 0) {
      throw new Error(`Cannot deactivate schedule with ${activeEmployees} active employee(s)`);
    }
    this.active = false;
    await this.save();
    return this;
  }

  async activate() {
    this.active = true;
    await this.save();
    return this;
  }

  toJSON() {
    const json = super.toJSON();
    // Add computed properties
    if (json.scheduleType === 'FLEXIBLE') {
      json.isFlexible = true;
    }
    return json;
  }
}
