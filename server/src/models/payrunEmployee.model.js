import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class PayrunEmployee extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        payrunId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'payrun_id',
        },
        employeeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'employee_id',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
      },
      {
        sequelize,
        tableName: 'payrun_employees',
        timestamps: false,
        indexes: [{ unique: true, fields: ['payrun_id', 'employee_id'] }],
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Payrun, { foreignKey: 'payrunId', as: 'payrun' });
    this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  }
}
