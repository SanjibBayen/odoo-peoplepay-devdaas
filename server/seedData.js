import { sequelize } from './src/config/database.js';
import models from './src/models/index.js';
import { hashPassword } from './src/utils/password.utils.js';

const { User, Role, Employee, Department, JobPosition, EmployeeType, WorkSchedule, Contract, TimeOffType, TimeOffAllocation } = models;

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Aryan', 'Kabir', 'Rudra', 'Dhruv', 'Advait', 'Samarth',
  'Priya', 'Ananya', 'Diya', 'Sara', 'Riya', 'Pooja', 'Neha', 'Kavya',
  'Meera', 'Isha', 'Tara', 'Zara', 'Nisha', 'Kiran', 'Asha', 'Rina',
  'John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa',
  'Tom', 'Anna', 'James', 'Maria', 'Robert', 'Emily', 'Daniel', 'Sophia',
  'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Naresh', 'Ganesh', 'Karthik',
  'Sneha', 'Komal', 'Ritika', 'Shweta', 'Anjali', 'Deepika', 'Kajal', 'Lakshmi',
  'Amit', 'Sumit', 'Rohit', 'Mohit', 'Rahul', 'Vikram', 'Ajay', 'Vijay',
  'Sanjay', 'Rajeev', 'Nitin', 'Pankaj', 'Sachin', 'Gaurav', 'Manoj', 'Ashok',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Shah', 'Mehta',
  'Agarwal', 'Jain', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao',
  'Chowdhury', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Das', 'Dutta', 'Roy', 'Sen',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall',
  'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson',
  'Hill', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner',
];

const BANK_NAMES = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Yes Bank', 'IndusInd Bank'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmployeeCode(index) {
  return `EMP${String(index + 1).padStart(4, '0')}`;
}

function generateEmail(firstName, lastName, index) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@peoplepay.com`;
}

function generatePhone() {
  return `+91${getRandomInt(7000000000, 9999999999)}`;
}

function generateBankAccount() {
  return `${getRandomInt(100000000000, 999999999999)}`;
}

function generateIFSC() {
  const bankCodes = ['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK', 'PUNB', 'YESB', 'INDB'];
  return `${getRandomItem(bankCodes)}${getRandomInt(100000, 999999)}`;
}

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const departments = await Department.findAll({ raw: true });
    const employeeTypes = await EmployeeType.findAll({ raw: true });
    const schedules = await WorkSchedule.findAll({ raw: true });
    const jobPositions = await JobPosition.findAll({ raw: true });
    const employeeRole = await Role.findOne({ where: { code: 'EMPLOYEE' }, raw: true });
    const timeOffTypes = await TimeOffType.findAll({ raw: true });

    console.log(`Found: ${departments.length} departments, ${employeeTypes.length} types, ${schedules.length} schedules, ${jobPositions.length} positions, ${timeOffTypes.length} leave types`);

    const totalEmployees = 300;
    console.log(`Seeding ${totalEmployees} employees...`);

    let seededCount = 0;
    let skippedCount = 0;
    const batchSize = 20;
    const totalBatches = Math.ceil(totalEmployees / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const transaction = await sequelize.transaction();

      try {
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalEmployees);

        for (let i = startIndex; i < endIndex; i++) {
          const firstName = getRandomItem(FIRST_NAMES);
          const lastName = getRandomItem(LAST_NAMES);
          const email = generateEmail(firstName, lastName, i);
          const employeeCode = generateEmployeeCode(i);
          const department = getRandomItem(departments);
          const employeeType = getRandomItem(employeeTypes);
          const schedule = getRandomItem(schedules);
          const jobPosition = getRandomItem(jobPositions);
          const phone = generatePhone();

          const emailExists = await User.findOne({ where: { email }, transaction });
          if (emailExists) { skippedCount++; continue; }

          const codeExists = await Employee.findOne({ where: { employeeCode }, transaction });
          if (codeExists) { skippedCount++; continue; }

          const password = `Employee@${getRandomInt(100, 999)}`;
          const hashedPassword = await hashPassword(password);

          // Create User
          const user = await User.create(
            { email, passwordHash: hashedPassword, firstName, lastName, isActive: true },
            { transaction }
          );

          // Assign role
          await sequelize.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON CONFLICT DO NOTHING`,
            {
              replacements: { userId: user.id, roleId: employeeRole.id },
              transaction,
              type: sequelize.QueryTypes.INSERT,
            }
          );

          // Create Employee
          const joiningDate = new Date(getRandomInt(2021, 2026), getRandomInt(0, 11), getRandomInt(1, 28));
          const dob = new Date(getRandomInt(1985, 2005), getRandomInt(0, 11), getRandomInt(1, 28));

          const employee = await Employee.create(
            {
              userId: user.id,
              employeeCode,
              firstName,
              lastName,
              email,
              phone,
              dob,
              gender: getRandomItem(['Male', 'Female', 'Other']),
              address: `${getRandomInt(1, 200)}, ${getRandomItem(['MG Road', 'Koramangala', 'Whitefield', 'HSR Layout'])}`,
              joiningDate,
              departmentId: department.id,
              jobPositionId: jobPosition?.id || null,
              employeeTypeId: employeeType.id,
              scheduleId: schedule?.id || null,
              status: 'ACTIVE',
              bankAccountNumber: generateBankAccount(),
              bankName: getRandomItem(BANK_NAMES),
              ifscCode: generateIFSC(),
              emergencyContactName: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
              emergencyContactPhone: generatePhone(),
            },
            { transaction }
          );

          // Create Contract
          await Contract.create(
            {
              employeeId: employee.id,
              contractNumber: `CNT-${String(i + 1).padStart(6, '0')}`,
              startDate: joiningDate,
              endDate: null,
              departmentId: department.id,
              jobPositionId: jobPosition?.id || null,
              scheduleId: schedule?.id || null,
              wage: getRandomInt(30000, 150000),
              wageType: 'MONTHLY',
              status: 'ACTIVE',
            },
            { transaction }
          );

          // Annual Leave allocation - NO remainingAmount (generated column)
          const annualLeave = timeOffTypes.find((t) => t.code === 'AL');
          if (annualLeave) {
            const year = new Date().getFullYear();
            await TimeOffAllocation.create(
              {
                employeeId: employee.id,
                timeOffTypeId: annualLeave.id,
                allocatedAmount: 20,
                usedAmount: getRandomInt(0, 12),
                validFrom: new Date(year, 0, 1),
                validTo: new Date(year, 11, 31),
                status: 'APPROVED',
              },
              { transaction }
            );
          }

          // Sick Leave allocation - NO remainingAmount
          const sickLeave = timeOffTypes.find((t) => t.code === 'SL');
          if (sickLeave) {
            const year = new Date().getFullYear();
            await TimeOffAllocation.create(
              {
                employeeId: employee.id,
                timeOffTypeId: sickLeave.id,
                allocatedAmount: 12,
                usedAmount: getRandomInt(0, 5),
                validFrom: new Date(year, 0, 1),
                validTo: new Date(year, 11, 31),
                status: 'APPROVED',
              },
              { transaction }
            );
          }

          seededCount++;
        }

        await transaction.commit();
        console.log(`Batch ${batch + 1}/${totalBatches} done. Total: ${seededCount}`);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    console.log('\n========================================');
    console.log('  SEEDING COMPLETE!');
    console.log('========================================');
    console.log(`  Created: ${seededCount} employees`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();