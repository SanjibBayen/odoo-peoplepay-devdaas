import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            notEmpty: true,
          },
          set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
          },
        },
        passwordHash: {
          type: DataTypes.TEXT,
          allowNull: false,
          field: 'password_hash',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'first_name',
          validate: {
            notEmpty: true,
            len: [1, 100],
          },
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'last_name',
        },
        avatarUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'avatar_url',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login_at',
        },
        passwordResetToken: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'password_reset_token',
        },
        passwordResetExpires: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'password_reset_expires',
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
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        defaultScope: {
          attributes: {
            exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'],
          },
        },
        scopes: {
          withPassword: {
            attributes: { include: ['passwordHash'] },
          },
          active: {
            where: { isActive: true },
          },
        },
        indexes: [{ unique: true, fields: ['email'] }, { fields: ['is_active'] }],
      }
    );
  }

  static associate(models) {
    this.hasOne(models.Employee, {
      foreignKey: 'userId',
      as: 'employee',
      onDelete: 'SET NULL',
    });

    this.belongsToMany(models.Role, {
      through: 'user_roles',
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'roles',
      timestamps: false,
    });

    this.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs',
    });

    this.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
    });
  }

  // Getters
  get fullName() {
    return `${this.firstName} ${this.lastName || ''}`.trim();
  }

  // Instance methods
  async hasPermission(module, action) {
    const { Permission } = this.sequelize.models;

    const permission = await Permission.findOne({
      where: { module, action },
      attributes: ['id'],
      include: [
        {
          model: this.sequelize.models.Role,
          as: 'roles',
          attributes: ['id'],
          required: true,
          through: { attributes: [] },
          include: [
            {
              model: this.sequelize.models.User,
              as: 'users',
              attributes: ['id'],
              required: true,
              where: { id: this.id },
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    return !!permission;
  }

  async hasRole(roleCode) {
    const roles = await this.getRoles({
      where: { code: roleCode },
      attributes: ['id'],
    });
    return roles.length > 0;
  }

  async getAllPermissions() {
    const permissions = await this.sequelize.models.Permission.findAll({
      attributes: ['module', 'action'],
      include: [
        {
          model: this.sequelize.models.Role,
          as: 'roles',
          attributes: [],
          required: true,
          through: { attributes: [] },
          include: [
            {
              model: this.sequelize.models.User,
              as: 'users',
              attributes: [],
              required: true,
              where: { id: this.id },
              through: { attributes: [] },
            },
          ],
        },
      ],
      raw: true,
    });

    return permissions;
  }

  async updateLastLogin() {
    this.lastLoginAt = new Date();
    await this.save({ hooks: false });
  }

  async assignRoles(roleIds) {
    return this.setRoles(roleIds);
  }

  toJSON() {
    const json = super.toJSON();
    delete json.passwordHash;
    delete json.passwordResetToken;
    delete json.passwordResetExpires;
    return json;
  }
}
