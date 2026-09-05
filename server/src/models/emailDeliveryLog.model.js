import Sequelize from 'sequelize';

const { Model, DataTypes } = Sequelize;

export default class EmailDeliveryLog extends Model {
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
          allowNull: true,
          field: 'payrun_id',
        },
        payslipId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'payslip_id',
        },
        employeeId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'employee_id',
        },
        recipientEmail: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'recipient_email',
        },
        subject: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'QUEUED',
        },
        sentAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'sent_at',
        },
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'error_message',
        },
        retryCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'retry_count',
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
        tableName: 'email_delivery_log',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Payrun, { foreignKey: 'payrunId', as: 'payrun' });
    this.belongsTo(models.Payslip, { foreignKey: 'payslipId', as: 'payslip' });
    this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  }

  async markSent() {
    this.status = 'SENT';
    this.sentAt = new Date();
    await this.save();
    return this;
  }

  async markFailed(error) {
    this.status = 'FAILED';
    this.errorMessage = error;
    this.retryCount += 1;
    await this.save();
    return this;
  }

  async retry() {
    if (this.retryCount >= 5) {
      throw new Error('Maximum retry attempts exceeded');
    }
    this.status = 'QUEUED';
    await this.save();
    return this;
  }
}
