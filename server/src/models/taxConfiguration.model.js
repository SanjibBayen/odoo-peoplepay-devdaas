import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class TaxConfiguration extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        financialYear: {
          type: DataTypes.STRING(20),
          allowNull: false,
          field: 'financial_year',
        },
        regime: {
          type: DataTypes.STRING(100),
          allowNull: false,
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
        tableName: 'tax_configurations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ unique: true, fields: ['country', 'financial_year', 'regime'] }],
      }
    );
  }

  static associate(models) {
    this.hasMany(models.TaxSlab, { foreignKey: 'taxConfigurationId', as: 'slabs' });
  }
}
