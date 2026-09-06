import Sequelize from 'sequelize';

const { Model, DataTypes, Op } = Sequelize;

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

  get fullName() {
    return `${this.firstName} ${this.lastName || ''}`.trim();
  }

  get initials() {
    const first = this.firstName?.[0] || '';
    const last = this.lastName?.[0] || '';
    return (first + last).toUpperCase();
  }

  // ============ PERMISSION METHODS ============

  /**
   * Check if user has specific permission
   * FIX: Admin role has ALL permissions automatically
   */
  async hasPermission(module, action) {
    try {
      // FIX: If user has ADMIN role, allow everything
      const isAdmin = await this.hasRole('ADMIN');
      if (isAdmin) return true;

      const { sequelize } = this.sequelize || {};
      if (!sequelize) return false;

      const [result] = await sequelize.query(
        `SELECT COUNT(*) as count
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = :userId
           AND p.module = :module
           AND p.action = :action
         LIMIT 1`,
        {
          replacements: { userId: this.id, module, action },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return parseInt(result?.count || 0) > 0;
    } catch (error) {
      console.error('hasPermission error:', error.message);
      return false;
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(roleCode) {
    try {
      const roles = await this.getRoles({
        where: { code: roleCode },
        attributes: ['id'],
      });
      return roles.length > 0;
    } catch (error) {
      console.error('hasRole error:', error.message);
      return false;
    }
  }

  /**
   * Get all permissions for user
   */
  async getAllPermissions() {
    try {
      const isAdmin = await this.hasRole('ADMIN');
      if (isAdmin) {
        const { sequelize } = this.sequelize || {};
        if (!sequelize) return [];
        const results = await sequelize.query(
          `SELECT module, action FROM permissions ORDER BY module, action`,
          { type: sequelize.QueryTypes.SELECT }
        );
        return results;
      }

      const { sequelize } = this.sequelize || {};
      if (!sequelize) return [];

      const results = await sequelize.query(
        `SELECT DISTINCT p.module, p.action
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
         WHERE ur.user_id = :userId
         ORDER BY p.module, p.action`,
        {
          replacements: { userId: this.id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      return results;
    } catch (error) {
      console.error('getAllPermissions error:', error.message);
      return [];
    }
  }

  /**
   * Get role codes for user
   */
  async getRoleCodes() {
    try {
      const roles = await this.getRoles({ attributes: ['code'] });
      return roles.map((role) => role.code);
    } catch (error) {
      return [];
    }
  }

  async updateLastLogin() {
    this.lastLoginAt = new Date();
    await this.save({ hooks: false });
    return this.lastLoginAt;
  }

  async assignRoles(roleIds) {
    return this.setRoles(roleIds);
  }

  async isAdmin() {
    return this.hasRole('ADMIN');
  }

  toJSON() {
    const json = super.toJSON();
    delete json.passwordHash;
    delete json.passwordResetToken;
    delete json.passwordResetExpires;
    return json;
  }
}