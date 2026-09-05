import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

export default class User extends Model {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: { isEmail: true }
            },
            passwordHash: {
                type: DataTypes.TEXT,
                allowNull: false,
                field: 'password_hash'
            },
            firstName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'first_name'
            },
            lastName: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'last_name'
            },
            avatarUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'avatar_url'
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: 'is_active'
            },
            lastLoginAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'last_login_at'
            },
            passwordResetToken: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'password_reset_token'
            },
            passwordResetExpires: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'password_reset_expires'
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'updated_at'
            }
        }, {
            sequelize,
            tableName: 'users',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            hooks: {
                beforeCreate: async(user) => {
                    if (user.passwordHash) {
                        const salt = await bcrypt.genSalt(12);
                        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
                    }
                },
                beforeUpdate: async(user) => {
                    if (user.changed('passwordHash')) {
                        const salt = await bcrypt.genSalt(12);
                        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
                    }
                }
            }
        });
    }

    static associate(models) {
        this.hasOne(models.Employee, { foreignKey: 'userId', as: 'employee' });
        this.belongsToMany(models.Role, {
            through: 'user_roles',
            foreignKey: 'user_id',
            otherKey: 'role_id',
            as: 'roles'
        });
        this.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
        this.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    }

    get fullName() {
        return `${this.firstName} ${this.lastName || ''}`.trim();
    }

    async validatePassword(password) {
        return bcrypt.compare(password, this.passwordHash);
    }

    async setPassword(password) {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(password, salt);
        await this.save();
    }

    async hasPermission(module, action) {
        const roles = await this.getRoles({ include: ['permissions'] });
        for (const role of roles) {
            const permissions = role.permissions || [];
            for (const permission of permissions) {
                if (permission.module === module && permission.action === action) {
                    return true;
                }
            }
        }
        return false;
    }

    async hasRole(roleCode) {
        const roles = await this.getRoles();
        return roles.some(r => r.code === roleCode);
    }

    toJSON() {
        const json = super.toJSON();
        delete json.passwordHash;
        delete json.passwordResetToken;
        delete json.passwordResetExpires;
        return json;
    }
}