import { sequelize } from '../config/database.js';
import User from './user.model.js';
import Role from './role.model.js';
import Permission from './permission.model.js';
import Employee from './employee.model.js';
import Department from './department.model.js';
import JobPosition from './jobposition.model.js';
import EmployeeType from './employeeType.model.js';
import WorkSchedule from './workSchedule.model.js';
import ScheduleDay from './scheduleDay.model.js';
import Contract from './contract.model.js';
import Attendance from './attendance.model.js';
import TimeOffType from './timeOffType.model.js';
import TimeOffAllocation from './timeOffAllocation.model.js';
import TimeOffRequest from './timeOffRequest.model.js';
import SalaryStructure from './salaryStructure.model.js';
import SalaryRule from './salaryRule.model.js';
import SalaryStructureRule from './salaryStructureRule.model.js';
import Payrun from './payrun.model.js';
import PayrunEmployee from './payrunEmployee.model.js';
import Payslip from './payslip.model.js';
import PayslipLine from './payslipLine.model.js';
import PayrollWarning from './payrollWarning.model.js';
import TaxConfiguration from './taxConfiguration.model.js';
import TaxSlab from './taxSlab.model.js';
import AuditLog from './auditLog.model.js';
import Notification from './notification.model.js';
import EmailDeliveryLog from './emailDeliveryLog.model.js';

const models = {
  User,
  Role,
  Permission,
  Employee,
  Department,
  JobPosition,
  EmployeeType,
  WorkSchedule,
  ScheduleDay,
  Contract,
  Attendance,
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  SalaryStructure,
  SalaryRule,
  SalaryStructureRule,
  Payrun,
  PayrunEmployee,
  Payslip,
  PayslipLine,
  PayrollWarning,
  TaxConfiguration,
  TaxSlab,
  AuditLog,
  Notification,
  EmailDeliveryLog
};

// Initialize all models
Object.values(models).forEach((model) => {
  if (typeof model.init === 'function') {
    model.init(sequelize);
  }
});

// Set up associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export const initializeDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('Database models synchronized');
    }
  } catch (error) {
    console.error('Failed to sync database:', error.message);
    throw error;
  }
};

export { sequelize };
export default models;