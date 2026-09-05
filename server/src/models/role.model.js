import { Model, DataTypes } from 'sequelize';

export default class Role extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true
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
            tableName: 'roles',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        });
    }

    static associate(models) {
        this.belongsToMany(models.User, {
            through: 'user_roles',
            foreignKey: 'role_id',
            otherKey: 'user_id',
            as: 'users'
        });
        this.belongsToMany(models.Permission, {
            through: 'role_permissions',
            foreignKey: 'role_id',
            otherKey: 'permission_id',
            as: 'permissions'
        });
    }
}