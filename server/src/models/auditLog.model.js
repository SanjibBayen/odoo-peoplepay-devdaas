import { Model, DataTypes } from 'sequelize';

export default class AuditLog extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'user_id'
            },
            entityType: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'entity_type'
            },
            entityId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'entity_id'
            },
            action: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            oldValues: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'old_values'
            },
            newValues: {
                type: DataTypes.JSONB,
                allowNull: true,
                field: 'new_values'
            },
            ipAddress: {
                type: DataTypes.INET,
                allowNull: true,
                field: 'ip_address'
            },
            userAgent: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'user_agent'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            }
        }, {
            sequelize,
            tableName: 'audit_logs',
            timestamps: false
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }

    static async logAction(userId, entityType, entityId, action, oldValues = null, newValues = null, ipAddress = null, userAgent = null) {
        return this.create({
            userId,
            entityType,
            entityId,
            action,
            oldValues,
            newValues,
            ipAddress,
            userAgent
        });
    }
}