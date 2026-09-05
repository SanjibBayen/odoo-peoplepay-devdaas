import { Model, DataTypes } from 'sequelize';

export default class Notification extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'user_id'
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR'),
                allowNull: false,
                defaultValue: 'INFO'
            },
            entityType: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'entity_type'
            },
            entityId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: 'entity_id'
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                field: 'is_read'
            },
            readAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'read_at'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            }
        }, {
            sequelize,
            tableName: 'notifications',
            timestamps: false
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }

    async markAsRead() {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
        return this;
    }

    static async createNotification(userId, title, message, type = 'INFO', entityType = null, entityId = null) {
        return this.create({
            userId,
            title,
            message,
            type,
            entityType,
            entityId
        });
    }
}