import { Model, DataTypes } from 'sequelize';

export default class Attendance extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            employeeId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'employee_id'
            },
            workDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'work_date'
            },
            checkIn: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'check_in'
            },
            checkOut: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'check_out'
            },
            breakMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'break_minutes'
            },
            workedMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'worked_minutes'
            },
            scheduledMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'scheduled_minutes'
            },
            overtimeMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'overtime_minutes'
            },
            lateMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'late_minutes'
            },
            earlyExitMinutes: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'early_exit_minutes'
            },
            status: {
                type: DataTypes.ENUM('PRESENT', 'LATE', 'ABSENT', 'EARLY_EXIT', 'OVERTIME', 'MISSING_CHECKOUT', 'CORRECTED'),
                allowNull: false,
                defaultValue: 'PRESENT'
            },
            isManualEntry: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_manual_entry'
            },
            correctionReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'correction_reason'
            },
            correctedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'corrected_by'
            },
            correctedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'corrected_at'
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
            tableName: 'attendance',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [{ unique: true, fields: ['employee_id', 'work_date'] }]
        });
    }

    static associate(models) {
        this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
        this.belongsTo(models.User, { foreignKey: 'correctedBy', as: 'corrector' });
    }

    calculateWorkedMinutes() {
        if (!this.checkIn || !this.checkOut) return 0;
        const duration = (this.checkOut - this.checkIn) / (1000 * 60);
        return Math.max(0, duration - (this.breakMinutes || 0));
    }
}