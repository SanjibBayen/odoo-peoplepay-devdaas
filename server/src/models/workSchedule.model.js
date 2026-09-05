import { Model, DataTypes } from 'sequelize';

export default class WorkSchedule extends Model {
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
            scheduleType: {
                type: DataTypes.ENUM('WEEKLY', 'FLEXIBLE', 'SHIFT'),
                allowNull: false,
                defaultValue: 'WEEKLY',
                field: 'schedule_type'
            },
            weeklyHours: {
                type: DataTypes.DECIMAL(6, 2),
                allowNull: false,
                defaultValue: 0,
                field: 'weekly_hours'
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
            tableName: 'working_schedules',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.hasMany(models.ScheduleDay, { foreignKey: 'scheduleId', as: 'scheduleDays' });
        this.hasMany(models.Employee, { foreignKey: 'scheduleId', as: 'employees' });
        this.hasMany(models.Contract, { foreignKey: 'scheduleId', as: 'contracts' });
    }

    calculateWeeklyHours() {
        if (!this.scheduleDays) return 0;
        return this.scheduleDays.reduce((total, day) => {
            if (!day.isWorkingDay || !day.startTime || !day.endTime) return total;
            const start = new Date(`1970-01-01T${day.startTime}`);
            const end = new Date(`1970-01-01T${day.endTime}`);
            let hours = (end - start) / (1000 * 60 * 60);
            hours -= (day.breakMinutes || 0) / 60;
            return total + Math.max(0, hours);
        }, 0);
    }
}