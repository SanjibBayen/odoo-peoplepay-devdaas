import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class EmployeeType extends Model {
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
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
        tableName: 'employee_types',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { unique: true, fields: ['code'] },
          { unique: true, fields: ['name'] },
          { fields: ['active'] },
        ],
        scopes: {
          active: {
            where: { active: true },
          },
        },
        hooks: {
          beforeDestroy: async (employeeType) => {
            // Check if type is assigned to any employee
            const employeeCount = await employeeType.countEmployees();
            if (employeeCount > 0) {
              throw new Error(
                `Cannot delete employee type assigned to ${employeeCount} employee(s)`
              );
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.hasMany(models.Employee, {
      foreignKey: 'employeeTypeId',
      as: 'employees',
    });

    this.hasMany(models.Contract, {
      foreignKey: 'employeeTypeId',
      as: 'contracts',
    });
  }

  // Instance methods
  async getEmployeeCount() {
    return this.countEmployees();
  }

  async getActiveEmployeeCount() {
    return this.countEmployees({
      where: { status: 'ACTIVE' },
    });
  }

  async getEmployeesByStatus() {
    const employees = await this.getEmployees({
      attributes: ['status'],
      group: ['status'],
    });
    return employees;
  }

  async deactivate() {
    // Check if type has active employees before deactivating
    const activeEmployees = await this.getActiveEmployeeCount();
    if (activeEmployees > 0) {
      throw new Error(`Cannot deactivate type with ${activeEmployees} active employee(s)`);
    }
    this.active = false;
    await this.save();
    return this;
  }

  async activate() {
    this.active = true;
    await this.save();
    return this;
  }

  toJSON() {
    const json = super.toJSON();
    return json;
  }
}
