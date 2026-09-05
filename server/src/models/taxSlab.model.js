import { Model, DataTypes } from 'sequelize';

export default class TaxSlab extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            taxConfigurationId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'tax_configuration_id'
            },
            minIncome: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: false,
                field: 'min_income'
            },
            maxIncome: {
                type: DataTypes.DECIMAL(15, 2),
                allowNull: true,
                field: 'max_income'
            },
            taxRate: {
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                field: 'tax_rate'
            },
            surchargeRate: {
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 0,
                field: 'surcharge_rate'
            },
            cessRate: {
                type: DataTypes.DECIMAL(8, 4),
                allowNull: false,
                defaultValue: 4.0,
                field: 'cess_rate'
            },
            sequence: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 10
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            }
        }, {
            sequelize,
            tableName: 'tax_slabs',
            timestamps: false
        });
    }

    static associate(models) {
        this.belongsTo(models.TaxConfiguration, { foreignKey: 'taxConfigurationId', as: 'taxConfiguration' });
    }
}