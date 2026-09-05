import { Model, DataTypes } from 'sequelize';

export default class Contract extends Model {
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
            contractNumber: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                field: 'contract_number'
            },
            startDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: 'start_date'
            },
            endDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                field: 'end_date'
            },
            departmentId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'department_id'
            },
            jobPositionId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'job_position_id'
            },
            scheduleId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'schedule_id'
            },
            salaryStructureId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'salary_structure_id'
            },
            wage: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            wageType: {
                type: DataTypes.ENUM('MONTHLY', 'ANNUAL', 'DAILY', 'HOURLY'),
                allowNull: false,
                defaultValue: 'MONTHLY',
                field: 'wage_type'
            },
            status: {
                type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED'),
                allowNull: false,
                defaultValue: 'DRAFT'
            },
            trialEndDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                field: 'trial_end_date'
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
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
            tableName: 'contracts',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
        this.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
        this.belongsTo(models.JobPosition, { foreignKey: 'jobPositionId', as: 'jobPosition' });
        this.belongsTo(models.WorkSchedule, { foreignKey: 'scheduleId', as: 'schedule' });
        this.belongsTo(models.SalaryStructure, { foreignKey: 'salaryStructureId', as: 'salaryStructure' });
    }

    isActiveOnDate(checkDate) {
        if (this.status !== 'ACTIVE') return false;
        if (checkDate < this.startDate) return false;
        if (this.endDate && checkDate > this.endDate) return false;
        return true;
    }
}