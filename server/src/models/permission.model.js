import { Model, DataTypes } from 'sequelize';

export default class Permission extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            module: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            action: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'permissions',
            timestamps: false,
            indexes: [{ unique: true, fields: ['module', 'action'] }]
        });
    }

    static associate(models) {
        this.belongsToMany(models.Role, {
            through: 'role_permissions',
            foreignKey: 'permission_id',
            otherKey: 'role_id',
            as: 'roles'
        });
    }
}