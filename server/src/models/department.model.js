import { Model, DataTypes } from 'sequelize';

export default class Department extends Model {
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
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            managerId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'manager_id'
            },
            parentId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'parent_id'
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
            tableName: 'departments',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsTo(models.Employee, { foreignKey: 'managerId', as: 'manager' });
        this.belongsTo(this, { foreignKey: 'parentId', as: 'parent' });
        this.hasMany(this, { foreignKey: 'parentId', as: 'subDepartments' });
        this.hasMany(models.Employee, { foreignKey: 'departmentId', as: 'employees' });
    }
}