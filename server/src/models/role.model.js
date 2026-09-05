import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class Role extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [2, 100],
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
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
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
        tableName: 'roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { unique: true, fields: ['code'] },
          { unique: true, fields: ['name'] },
        ],
      }
    );
  }

  static associate(models) {
    this.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'users',
      timestamps: false,
    });

    this.belongsToMany(models.Permission, {
      through: 'role_permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
      timestamps: false,
    });
  }

  // Instance methods
  async assignPermissions(permissionIds) {
    return this.setPermissions(permissionIds);
  }

  async addPermission(permissionId) {
    return this.addPermission(permissionId);
  }

  async removePermission(permissionId) {
    return this.removePermission(permissionId);
  }

  async hasPermission(module, action) {
    const permissions = await this.getPermissions({
      where: { module, action },
      attributes: ['id'],
    });
    return permissions.length > 0;
  }

  async getPermissionList() {
    return this.getPermissions({
      attributes: ['module', 'action', 'description'],
      order: [
        ['module', 'ASC'],
        ['action', 'ASC'],
      ],
    });
  }

  async getUserCount() {
    const users = await this.getUsers({
      where: { isActive: true },
    });
    return users.length;
  }

  toJSON() {
    const json = super.toJSON();
    return json;
  }
}
