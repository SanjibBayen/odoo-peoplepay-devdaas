import { Model, DataTypes } from 'sequelize';

export default class TimeOffRequest extends Model {
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
            timeOffTypeId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'time_off_type_id'
            },
            allocationId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'allocation_id'
            },
            startDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'start_date'
            },
            endDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'end_date'
            },
            duration: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            unit: {
                type: DataTypes.ENUM('DAYS', 'HOURS'),
                allowNull: false,
                defaultValue: 'DAYS'
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED', 'EXPIRED'),
                allowNull: false,
                defaultValue: 'PENDING'
            },
            approvedBy: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'approved_by'
            },
            approvedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'approved_at'
            },
            refusalReason: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'refusal_reason'
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
            tableName: 'time_off_requests',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
        this.belongsTo(models.TimeOffType, { foreignKey: 'timeOffTypeId', as: 'timeOffType' });
        this.belongsTo(models.TimeOffAllocation, { foreignKey: 'allocationId', as: 'allocation' });
        this.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
    }

    calculateDuration() {
        if (this.startDate && this.endDate) {
            const diffTime = Math.abs(this.endDate - this.startDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
        return 0;
    }
}