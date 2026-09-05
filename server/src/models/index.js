import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

import User from './user.model.js';
import Role from './role.model.js';
import Permission from './permission.model.js';
import Department from './Department.js';
import JobPosition from './JobPosition.js';
import EmployeeType from './EmployeeType.js';
import WorkSchedule from './WorkSchedule.js';
import ScheduleDay from './ScheduleDay.js';
import Employee from './Employee.js';
import Contract from './Contract.js';
import SalaryStructure from './SalaryStructure.js';
import SalaryRule from './SalaryRule.js';
import SalaryStructureRule from './SalaryStructureRule.js';
import Attendance from './Attendance.js';
import TimeOffType from './TimeOffType.js';
import TimeOffAllocation from './TimeOffAllocation.js';
import TimeOffRequest from './TimeOffRequest.js';
import TaxConfiguration from './TaxConfiguration.js';
import TaxSlab from './TaxSlab.js';
import Payrun from './Payrun.js';
import PayrunEmployee from './PayrunEmployee.js';
import Payslip from './Payslip.js';
import PayslipLine from './PayslipLine.js';
import PayrollWarning from './PayrollWarning.js';
import AuditLog from './AuditLog.js';
import Notification from './Notification.js';
import EmailDeliveryLog from './EmailDeliveryLog.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME || 'peoplepay360',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            useUTC: true,
            timezone: 'UTC'
        }
    }
);

// Initialize all models
const models = {
    User: User.init(sequelize),
    Role: Role.init(sequelize),
    Permission: Permission.init(sequelize),
    Department: Department.init(sequelize),
    JobPosition: JobPosition.init(sequelize),
    EmployeeType: EmployeeType.init(sequelize),
    WorkSchedule: WorkSchedule.init(sequelize),
    ScheduleDay: ScheduleDay.init(sequelize),
    Employee: Employee.init(sequelize),
    Contract: Contract.init(sequelize),
    SalaryStructure: SalaryStructure.init(sequelize),
    SalaryRule: SalaryRule.init(sequelize),
    SalaryStructureRule: SalaryStructureRule.init(sequelize),
    Attendance: Attendance.init(sequelize),
    TimeOffType: TimeOffType.init(sequelize),
    TimeOffAllocation: TimeOffAllocation.init(sequelize),
    TimeOffRequest: TimeOffRequest.init(sequelize),
    TaxConfiguration: TaxConfiguration.init(sequelize),
    TaxSlab: TaxSlab.init(sequelize),
    Payrun: Payrun.init(sequelize),
    PayrunEmployee: PayrunEmployee.init(sequelize),
    Payslip: Payslip.init(sequelize),
    PayslipLine: PayslipLine.init(sequelize),
    PayrollWarning: PayrollWarning.init(sequelize),
    AuditLog: AuditLog.init(sequelize),
    Notification: Notification.init(sequelize),
    EmailDeliveryLog: EmailDeliveryLog.init(sequelize)
};

// Set up associations
Object.values(models).forEach((model) => {
    if (model.associate) {
        model.associate(models);
    }
});

// Export
const {
    User,
    Role,
    Permission,
    Department,
    JobPosition,
    EmployeeType,
    WorkSchedule,
    ScheduleDay,
    Employee,
    Contract,
    SalaryStructure,
    SalaryRule,
    SalaryStructureRule,
    Attendance,
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    TaxConfiguration,
    TaxSlab,
    Payrun,
    PayrunEmployee,
    Payslip,
    PayslipLine,
    PayrollWarning,
    AuditLog,
    Notification,
    EmailDeliveryLog
} = models;

export {
    sequelize,
    Sequelize,
    User,
    Role,
    Permission,
    Department,
    JobPosition,
    EmployeeType,
    WorkSchedule,
    ScheduleDay,
    Employee,
    Contract,
    SalaryStructure,
    SalaryRule,
    SalaryStructureRule,
    Attendance,
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    TaxConfiguration,
    TaxSlab,
    Payrun,
    PayrunEmployee,
    Payslip,
    PayslipLine,
    PayrollWarning,
    AuditLog,
    Notification,
    EmailDeliveryLog
};

export default models;