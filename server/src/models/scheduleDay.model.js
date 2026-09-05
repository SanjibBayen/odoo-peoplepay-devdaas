import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class ScheduleDay extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        scheduleId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'schedule_id',
          references: {
            model: 'working_schedules',
            key: 'id',
          },
        },
        dayOfWeek: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'day_of_week',
          validate: {
            min: 0,
            max: 6,
            isInt: true,
          },
          comment: '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday',
        },
        startTime: {
          type: DataTypes.TIME,
          allowNull: true,
          field: 'start_time',
          validate: {
            isValidTime(value) {
              if (value === null || value === undefined) return;
              const timeStr = typeof value === 'string' ? value : value.toString();
              if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeStr)) {
                throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
              }
            },
          },
        },
        endTime: {
          type: DataTypes.TIME,
          allowNull: true,
          field: 'end_time',
          validate: {
            isValidTime(value) {
              if (value === null || value === undefined) return;
              const timeStr = typeof value === 'string' ? value : value.toString();
              if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeStr)) {
                throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
              }
            },
          },
        },
        breakMinutes: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'break_minutes',
          validate: {
            min: 0,
            max: 720, // Maximum 12 hours break
            isInt: true,
          },
        },
        isWorkingDay: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_working_day',
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
        tableName: 'schedule_days',
        timestamps: false, // Only createdAt, no updatedAt
        indexes: [
          { unique: true, fields: ['schedule_id', 'day_of_week'] },
          { fields: ['schedule_id'] },
          { fields: ['day_of_week'] },
          { fields: ['is_working_day'] },
        ],
        validate: {
          timeValidation() {
            // Working days must have start and end times
            if (this.isWorkingDay && (!this.startTime || !this.endTime)) {
              throw new Error('Working days must have both start and end times');
            }

            // Non-working days should not have times
            if (!this.isWorkingDay && (this.startTime || this.endTime)) {
              // Allow times for non-working days (e.g., on-call)
              // Remove this check if you want to allow times for non-working days
            }

            // End time must be after start time
            if (this.startTime && this.endTime) {
              const startMinutes = this.timeToMinutes(this.startTime);
              const endMinutes = this.timeToMinutes(this.endTime);

              if (endMinutes <= startMinutes) {
                throw new Error('End time must be after start time');
              }
            }
          },
        },
        hooks: {
          afterSave: async (scheduleDay) => {
            // Recalculate weekly hours when schedule day changes
            const { WorkSchedule } = sequelize.models;
            const schedule = await WorkSchedule.findByPk(scheduleDay.scheduleId);
            if (schedule) {
              await schedule.recalculateWeeklyHours();
            }
          },
          afterDestroy: async (scheduleDay) => {
            // Recalculate weekly hours when schedule day is deleted
            const { WorkSchedule } = sequelize.models;
            const schedule = await WorkSchedule.findByPk(scheduleDay.scheduleId);
            if (schedule) {
              await schedule.recalculateWeeklyHours();
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.WorkSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
      onDelete: 'CASCADE',
    });
  }

  // Utility: Convert time string to minutes
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;

    // Handle Date objects
    if (timeStr instanceof Date) {
      return timeStr.getHours() * 60 + timeStr.getMinutes();
    }

    // Handle string format "HH:MM" or "HH:MM:SS"
    const parts = timeStr.toString().split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);

    return hours * 60 + minutes;
  }

  // Utility: Parse time safely
  parseTime(timeStr) {
    if (!timeStr) return { hours: 0, minutes: 0 };

    if (timeStr instanceof Date) {
      return {
        hours: timeStr.getHours(),
        minutes: timeStr.getMinutes(),
      };
    }

    if (typeof timeStr === 'string') {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return {
        hours: hours || 0,
        minutes: minutes || 0,
      };
    }

    return { hours: 0, minutes: 0 };
  }

  // Instance methods
  calculateWorkingHours() {
    if (!this.startTime || !this.endTime || !this.isWorkingDay) return 0;

    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    let totalMinutes = endMinutes - startMinutes;

    // Handle overnight shifts (if end time is less than start time)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours
    }

    // Subtract break time
    totalMinutes -= this.breakMinutes || 0;

    // Convert to hours and round to 2 decimal places
    const hours = Math.max(0, totalMinutes / 60);
    return Math.round(hours * 100) / 100;
  }

  // Get day name
  getDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.dayOfWeek];
  }

  // Check if it's a weekend
  isWeekend() {
    return this.dayOfWeek === 0 || this.dayOfWeek === 6;
  }

  // Check if it's a weekday
  isWeekday() {
    return !this.isWeekend();
  }

  // Get formatted time range
  getTimeRange() {
    if (!this.startTime || !this.endTime) return 'Not set';
    return `${this.startTime} - ${this.endTime}`;
  }

  // Check if overnight shift
  isOvernightShift() {
    if (!this.startTime || !this.endTime) return false;
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    return endMinutes < startMinutes;
  }

  // Get break time in hours
  getBreakHours() {
    return Math.round((this.breakMinutes / 60) * 100) / 100;
  }

  // Compare with another schedule day
  isSameAs(otherDay) {
    return (
      this.startTime === otherDay.startTime &&
      this.endTime === otherDay.endTime &&
      this.breakMinutes === otherDay.breakMinutes &&
      this.isWorkingDay === otherDay.isWorkingDay
    );
  }

  // Clone this schedule day for another schedule
  async cloneForSchedule(newScheduleId) {
    const { ScheduleDay } = this.sequelize.models;
    return ScheduleDay.create({
      scheduleId: newScheduleId,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      breakMinutes: this.breakMinutes,
      isWorkingDay: this.isWorkingDay,
    });
  }

  toJSON() {
    const json = super.toJSON();
    // Add computed properties
    json.dayName = this.getDayName();
    json.isWeekend = this.isWeekend();
    json.workingHours = this.calculateWorkingHours();
    json.timeRange = this.getTimeRange();
    json.breakHours = this.getBreakHours();

    return json;
  }
}
