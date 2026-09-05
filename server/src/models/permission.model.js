import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class Permission extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        module: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            isIn: [
              [
                'employees',
                'contracts',
                'attendance',
                'time_off_types',
                'time_off_allocations',
                'time_off_requests',
                'working_schedules',
                'salary_structures',
                'salary_rules',
                'payruns',
                'payslips',
                'reports',
                'users',
              ],
            ],
          },
          set(value) {
            this.setDataValue('module', value.toLowerCase().replace(/\s+/g, '_'));
          },
        },
        action: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            isIn: [
              [
                'read_own',
                'read_all',
                'read',
                'create',
                'update',
                'delete',
                'approve',
                'validate',
                'send_email',
                'manage',
              ],
            ],
          },
          set(value) {
            this.setDataValue('action', value.toLowerCase().replace(/\s+/g, '_'));
          },
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'permissions',
        timestamps: false,
        indexes: [
          { unique: true, fields: ['module', 'action'] },
          { fields: ['module'] },
          { fields: ['action'] },
        ],
        validate: {
          validModuleActionCombination() {
            const validCombinations = {
              employees: ['read_own', 'read_all', 'create', 'update', 'delete'],
              contracts: ['read_own', 'read_all', 'create', 'update', 'delete'],
              attendance: ['read_own', 'read_all', 'create', 'update', 'delete'],
              time_off_types: ['read', 'create', 'update', 'delete'],
              time_off_allocations: ['read_own', 'read_all', 'create', 'approve', 'delete'],
              time_off_requests: ['read_own', 'read_all', 'create', 'approve', 'delete'],
              working_schedules: ['read', 'create', 'update', 'delete'],
              salary_structures: ['read', 'create', 'update', 'delete'],
              salary_rules: ['read', 'create', 'update', 'delete'],
              payruns: ['read', 'create', 'update', 'validate', 'delete'],
              payslips: ['read_own', 'read_all', 'create', 'update', 'delete', 'send_email'],
              reports: ['read'],
              users: ['manage'],
            };

            if (this.module && this.action) {
              const allowedActions = validCombinations[this.module];
              if (allowedActions && !allowedActions.includes(this.action)) {
                throw new Error(`Invalid action '${this.action}' for module '${this.module}'`);
              }
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
      timestamps: false,
    });
  }

  // Instance methods
  async getRoleCount() {
    const roles = await this.getRoles();
    return roles.length;
  }

  get moduleAction() {
    return `${this.module}:${this.action}`;
  }

  toJSON() {
    const json = super.toJSON();
    json.moduleAction = this.moduleAction;
    return json;
  }
}
