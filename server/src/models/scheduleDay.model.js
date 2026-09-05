import { Model, DataTypes } from 'sequelize';

export default class ScheduleDay extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            scheduleId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'schedule_id'
            },
            dayOfWeek: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'day_of_week',
                validate: { min: 0, max: 6 }
            },
            startTime: {
                type: DataTypes.TIME,
                allowNull: true,
                field: 'start_time'
            },
            endTime: {
                type: DataTypes.TIME,
                allowNull: true,
                field: 'end_time'
            },
            breakMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'break_minutes'
            },
            isWorkingDay: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: 'is_working_day'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            }
        }, {
            sequelize,
            tableName: 'schedule_days',
            timestamps: false,
            indexes: [{ unique: true, fields: ['schedule_id', 'day_of_week'] }]
        });
    }

    static associate(models) {
        this.belongsTo(models.WorkSchedule, { foreignKey: 'scheduleId', as: 'schedule' });
    }

    calculateWorkingHours() {
        if (!this.startTime || !this.endTime || !this.isWorkingDay) return 0;
        const start = new Date(`1970-01-01T${this.startTime}`);
        const end = new Date(`1970-01-01T${this.endTime}`);
        let hours = (end - start) / (1000 * 60 * 60);
        hours -= (this.breakMinutes || 0) / 60;
        return Math.max(0, hours);
    }
}