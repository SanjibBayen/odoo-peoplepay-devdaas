import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class Department extends Model {
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
        managerId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'manager_id',
          references: {
            model: 'employees',
            key: 'id',
          },
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'parent_id',
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
        tableName: 'departments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          { unique: true, fields: ['code'] },
          { fields: ['parent_id'] },
          { fields: ['manager_id'] },
          { fields: ['active'] },
        ],
        scopes: {
          active: {
            where: { active: true },
          },
          withManager: {
            include: [{ model: sequelize.models.Employee, as: 'manager' }],
          },
          withParent: {
            include: [{ model: sequelize.models.Department, as: 'parentDepartment' }],
          },
          withChildren: {
            include: [{ model: sequelize.models.Department, as: 'childDepartments' }],
          },
        },
        hooks: {
          beforeValidate: (department) => {
            // Prevent self-reference
            if (department.parentId === department.id) {
              throw new Error('Department cannot be its own parent');
            }
          },
          beforeDestroy: async (department) => {
            // Prevent deletion if has employees or child departments
            const employeeCount = await department.countEmployees();
            if (employeeCount > 0) {
              throw new Error('Cannot delete department with assigned employees');
            }

            const childCount = await department.countChildDepartments();
            if (childCount > 0) {
              throw new Error('Cannot delete department with child departments');
            }
          },
        },
      }
    );
  }

  static associate(models) {
    // Manager reference (Employee)
    this.belongsTo(models.Employee, {
      foreignKey: 'managerId',
      as: 'manager',
      onDelete: 'SET NULL',
    });

    // Self-referencing hierarchy
    this.belongsTo(this, {
      foreignKey: 'parentId',
      as: 'parentDepartment',
      onDelete: 'SET NULL',
    });

    this.hasMany(this, {
      foreignKey: 'parentId',
      as: 'childDepartments',
      onDelete: 'SET NULL',
    });

    // Other associations
    this.hasMany(models.Employee, {
      foreignKey: 'departmentId',
      as: 'employees',
    });

    this.hasMany(models.JobPosition, {
      foreignKey: 'departmentId',
      as: 'jobPositions',
    });

    this.hasMany(models.Contract, {
      foreignKey: 'departmentId',
      as: 'contracts',
    });
  }

  // Instance methods
  async getFullHierarchy() {
    const children = await this.getChildDepartments({
      include: [
        {
          model: Department,
          as: 'childDepartments',
          include: [
            {
              model: Department,
              as: 'childDepartments',
            },
          ],
        },
      ],
    });
    return children;
  }

  async getActiveEmployeeCount() {
    const employees = await this.getEmployees({
      where: { status: 'ACTIVE' },
    });
    return employees.length;
  }

  async getTotalEmployeeCount() {
    return this.countEmployees();
  }

  async getDepartmentHeadcount() {
    const employees = await this.getEmployees({
      attributes: ['id', 'firstName', 'lastName', 'status'],
      where: { status: 'ACTIVE' },
    });
    return employees;
  }

  async getAllSubDepartments() {
    const allChildren = [];
    const fetchChildren = async (deptId) => {
      const children = await Department.findAll({
        where: { parentId: deptId, active: true },
      });
      for (const child of children) {
        allChildren.push(child);
        await fetchChildren(child.id);
      }
    };
    await fetchChildren(this.id);
    return allChildren;
  }

  async isParentOf(deptId) {
    const children = await this.getAllSubDepartments();
    return children.some((d) => d.id === deptId);
  }

  toJSON() {
    const json = super.toJSON();
    return json;
  }
}
