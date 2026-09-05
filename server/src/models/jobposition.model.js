import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class JobPosition extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 150],
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
        departmentId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'department_id',
          references: {
            model: 'departments',
            key: 'id',
          },
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
        tableName: 'job_positions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { unique: true, fields: ['code'] },
          { fields: ['department_id'] },
          { fields: ['active'] },
        ],
        scopes: {
          active: {
            where: { active: true },
          },
          byDepartment: (departmentId) => ({
            where: { departmentId },
          }),
          withDepartment: {
            include: [{ model: sequelize.models.Department, as: 'department' }],
          },
        },
        hooks: {
          beforeValidate: async (jobPosition) => {
            // Check if department exists and is active
            if (jobPosition.departmentId) {
              const { Department } = sequelize.models;
              const dept = await Department.findByPk(jobPosition.departmentId);
              if (dept && !dept.active) {
                throw new Error('Cannot assign position to inactive department');
              }
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
      onDelete: 'SET NULL',
    });

    this.hasMany(models.Employee, {
      foreignKey: 'jobPositionId',
      as: 'employees',
    });

    this.hasMany(models.Contract, {
      foreignKey: 'jobPositionId',
      as: 'contracts',
    });
  }

  // Instance methods
  async getActiveEmployees() {
    return this.getEmployees({
      where: { status: 'ACTIVE' },
    });
  }

  async getEmployeeCount() {
    return this.countEmployees({
      where: { status: 'ACTIVE' },
    });
  }

  async isVacant() {
    const count = await this.getEmployeeCount();
    return count === 0;
  }

  async getDepartmentInfo() {
    return this.getDepartment({
      attributes: ['id', 'name', 'code', 'active'],
    });
  }

  async deactivate() {
    // Check if position has active employees before deactivating
    const activeEmployees = await this.getActiveEmployees();
    if (activeEmployees.length > 0) {
      throw new Error(
        `Cannot deactivate position with ${activeEmployees.length} active employee(s)`
      );
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
