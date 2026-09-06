import { sequelize } from './src/config/database.js';
import models from './src/models/index.js';
import { hashPassword } from './src/utils/password.utils.js';

const {
  User, Role, Employee, Department, JobPosition, EmployeeType,
  WorkSchedule, Contract, TimeOffType, TimeOffAllocation,
  TimeOffRequest, Payrun, Payslip, PayrunEmployee, Attendance,
} = models;

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
];

const BANK_NAMES = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'];

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Get reference data
    const departments = await Department.findAll({ raw: true });
    const employeeTypes = await EmployeeType.findAll({ raw: true });
    const schedules = await WorkSchedule.findAll({ raw: true });
    const jobPositions = await JobPosition.findAll({ raw: true });
    const employeeRole = await Role.findOne({ where: { code: 'EMPLOYEE' }, raw: true });
    const timeOffTypes = await TimeOffType.findAll({ raw: true });

    console.log(`Reference data loaded: ${departments.length} depts, ${employeeTypes.length} types, ${schedules.length} schedules`);

    const totalEmployees = 300;
    console.log(`\n=== SEEDING ${totalEmployees} EMPLOYEES ===`);

    let seededCount = 0;
    const batchSize = 20;

    for (let batch = 0; batch < Math.ceil(totalEmployees / batchSize); batch++) {
      const transaction = await sequelize.transaction();

      try {
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalEmployees);

        for (let i = startIndex; i < endIndex; i++) {
          const firstName = getRandomItem(FIRST_NAMES);
          const lastName = getRandomItem(LAST_NAMES);
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@peoplepay.com`;
          const employeeCode = `EMP${String(i + 1).padStart(4, '0')}`;
          const department = getRandomItem(departments);
          const employeeType = getRandomItem(employeeTypes);
          const schedule = getRandomItem(schedules);
          const jobPosition = getRandomItem(jobPositions);

          const emailExists = await User.findOne({ where: { email }, transaction });
          if (emailExists) continue;

          // Create User
          const password = `Employee@${getRandomInt(100, 999)}`;
          const hashedPassword = await hashPassword(password);
          const user = await User.create(
            { email, passwordHash: hashedPassword, firstName, lastName, isActive: true },
            { transaction }
          );

          // Assign role
          await sequelize.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON CONFLICT DO NOTHING`,
            { replacements: { userId: user.id, roleId: employeeRole.id }, transaction, type: sequelize.QueryTypes.INSERT }
          );

          // Create Employee
          const joiningDate = new Date(getRandomInt(2021, 2025), getRandomInt(0, 11), getRandomInt(1, 28));
          const employee = await Employee.create(
            {
              userId: user.id, employeeCode, firstName, lastName, email,
              phone: `+91${getRandomInt(7000000000, 9999999999)}`,
              dob: new Date(getRandomInt(1985, 2005), getRandomInt(0, 11), getRandomInt(1, 28)),
              gender: getRandomItem(['Male', 'Female']),
              address: `${getRandomInt(1, 200)}, ${getRandomItem(['MG Road', 'Koramangala', 'Whitefield'])}`,
              joiningDate,
              departmentId: department.id,
              jobPositionId: jobPosition?.id || null,
              employeeTypeId: employeeType.id,
              scheduleId: schedule?.id || null,
              status: 'ACTIVE',
              bankAccountNumber: `${getRandomInt(100000000000, 999999999999)}`,
              bankName: getRandomItem(BANK_NAMES),
              ifscCode: `${getRandomItem(['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK'])}${getRandomInt(100000, 999999)}`,
            },
            { transaction }
          );

          // Create Contract
          const wage = getRandomInt(30000, 150000);
          await Contract.create(
            {
              employeeId: employee.id,
              contractNumber: `CNT-${String(i + 1).padStart(6, '0')}`,
              startDate: joiningDate,
              endDate: null,
              departmentId: department.id,
              jobPositionId: jobPosition?.id || null,
              scheduleId: schedule?.id || null,
              wage,
              wageType: 'MONTHLY',
              status: 'ACTIVE',
            },
            { transaction }
          );

          // Create Time Off Allocations
          const year = new Date().getFullYear();
          const annualLeave = timeOffTypes.find((t) => t.code === 'AL');
          if (annualLeave) {
            await TimeOffAllocation.create(
              { employeeId: employee.id, timeOffTypeId: annualLeave.id, allocatedAmount: 20, usedAmount: getRandomInt(0, 10), validFrom: new Date(year, 0, 1), validTo: new Date(year, 11, 31), status: 'APPROVED' },
              { transaction }
            );
          }

          const sickLeave = timeOffTypes.find((t) => t.code === 'SL');
          if (sickLeave) {
            await TimeOffAllocation.create(
              { employeeId: employee.id, timeOffTypeId: sickLeave.id, allocatedAmount: 12, usedAmount: getRandomInt(0, 5), validFrom: new Date(year, 0, 1), validTo: new Date(year, 11, 31), status: 'APPROVED' },
              { transaction }
            );
          }

          // Create Attendance for last 30 days
          const today = new Date();
          for (let day = 1; day <= 30; day++) {
            const workDate = new Date(today);
            workDate.setDate(today.getDate() - day);

            // Skip weekends
            const dayOfWeek = workDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            // 90% chance of present
            const isPresent = Math.random() < 0.9;
            if (isPresent) {
              const checkIn = new Date(workDate);
              checkIn.setHours(getRandomInt(8, 9), getRandomInt(0, 59), 0, 0);
              const checkOut = new Date(workDate);
              checkOut.setHours(getRandomInt(17, 18), getRandomInt(0, 59), 0, 0);

              const workedMinutes = (checkOut - checkIn) / (1000 * 60) - 60;
              const lateMinutes = Math.random() < 0.2 ? getRandomInt(5, 30) : 0;

              await Attendance.create(
                {
                  employeeId: employee.id,
                  workDate,
                  checkIn,
                  checkOut,
                  breakMinutes: 60,
                  workedMinutes: Math.max(0, Math.round(workedMinutes)),
                  scheduledMinutes: 480,
                  overtimeMinutes: Math.random() < 0.1 ? getRandomInt(15, 60) : 0,
                  lateMinutes,
                  status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
                },
                { transaction }
              );
            }
          }

          seededCount++;
          if (seededCount % 50 === 0) {
            console.log(`Seeded ${seededCount} employees with attendance and allocations...`);
          }
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    // ============ CREATE PAYRUN WITH PAYSLIPS ============
    console.log('\n=== CREATING PAYRUN & PAYSLIPS ===');

    const salaryStructures = await models.SalaryStructure.findAll({ raw: true });
    const adminUser = await User.findOne({ where: { email: 'sanjibbayen11@gmail.com' }, raw: true });

    if (salaryStructures.length > 0 && adminUser) {
      const allEmployees = await Employee.findAll({ where: { status: 'ACTIVE' }, raw: true });
      const year = new Date().getFullYear();
      const month = new Date().getMonth();

      // Create Payrun for current month
      const payrun = await Payrun.create({
        name: `September ${year} Payroll`,
        salaryStructureId: salaryStructures[0].id,
        periodStart: new Date(year, month, 1),
        periodEnd: new Date(year, month + 1, 0),
        status: 'COMPUTED',
        employeeCount: allEmployees.length,
        totalGross: 0,
        totalDeductions: 0,
        totalTax: 0,
        totalNet: 0,
        createdBy: adminUser.id,
        computedAt: new Date(),
      });

      let totalGross = 0, totalDeductions = 0, totalTax = 0, totalNet = 0;

      for (const employee of allEmployees) {
        const contract = await Contract.findOne({ where: { employeeId: employee.id, status: 'ACTIVE' }, raw: true });
        if (!contract) continue;

        const basicSalary = Math.round(parseFloat(contract.wage) * 0.4);
        const hra = Math.round(parseFloat(contract.wage) * 0.2);
        const allowances = Math.round(parseFloat(contract.wage) * 0.4);
        const gross = parseFloat(contract.wage);
        const pf = Math.round(basicSalary * 0.12);
        const pt = 200;
        const tds = Math.round(gross * 0.05);
        const totalDeduction = pf + pt + tds;
        const net = gross - totalDeduction;

        totalGross += gross;
        totalDeductions += totalDeduction;
        totalTax += tds;
        totalNet += net;

        await Payslip.create({
          payslipNumber: `PS-${year}${String(month + 1).padStart(2, '0')}-${employee.employeeCode}`,
          payrunId: payrun.id,
          employeeId: employee.id,
          contractId: contract.id,
          salaryStructureId: salaryStructures[0].id,
          periodStart: new Date(year, month, 1),
          periodEnd: new Date(year, month + 1, 0),
          workedDays: 22,
          workedHours: 176,
          scheduledDays: 22,
          grossSalary: gross,
          totalAllowances: hra + allowances,
          totalDeductions: totalDeduction,
          taxAmount: tds,
          netSalary: net,
          status: 'VALIDATED',
        });
      }

      // Update payrun totals
      payrun.totalGross = totalGross;
      payrun.totalDeductions = totalDeductions;
      payrun.totalTax = totalTax;
      payrun.totalNet = totalNet;
      payrun.status = 'VALIDATED';
      await payrun.save();

      console.log(`Payrun created with ${allEmployees.length} employees`);
      console.log(`Total Gross: ₹${totalGross.toLocaleString()}`);
      console.log(`Total Net: ₹${totalNet.toLocaleString()}`);
    }

    console.log('\n========================================');
    console.log('  SEEDING COMPLETE!');
    console.log('========================================');
    console.log(`  Employees: ${seededCount}`);
    console.log('  Attendance: 30 days per employee');
    console.log('  Contracts: Active for each employee');
    console.log('  Time Off Allocations: Annual + Sick Leave');
    console.log('  Payrun: 1 payrun with payslips');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedData();