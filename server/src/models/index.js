import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

import User from './user.model.js';
import Role from './role.model.js';
import Permission from './permission.model.js';
import Department from './department.model.js';
import JobPosition from './jobposition.model.js';
import EmployeeType from './employeeType.model.js';
import WorkSchedule from './workSchedule.model.js';
import ScheduleDay from './scheduleDay.model.js';
import Employee from './employee.model.js';
import Contract from './contract.model.js';
import SalaryStructure from './salaryStructure.model.js';
import SalaryRule from './salaryRule.model.js';
import SalaryStructureRule from './salaryStructureRule.model.js';
import Attendance from './attendance.model.js';
import TimeOffType from './timeOffType.model.js';
import TimeOffAllocation from './timeOffAllocation.model.js';
import TimeOffRequest from './timeOffRequest.model.js';
import TaxConfiguration from './taxConfiguration.model.js';
import TaxSlab from './taxSlab.model.js';
import Payrun from './payrun.model.js';
import PayrunEmployee from './payrunEmployee.model.js';
import Payslip from './payslip.model.js';
import PayslipLine from './payslipLine.model.js';
import PayrollWarning from './payrollWarning.model.js';
import AuditLog from './auditLog.model.js';
import Notification from './notification.model.js';
import EmailDeliveryLog from './emailDeliveryLog.model.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
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

// Export all models individually
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

// Default export for convenience
export default models;