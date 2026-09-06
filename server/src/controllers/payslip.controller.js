import Sequelize from 'sequelize';
import Payslip from '../models/payslip.model.js';
import PayslipLine from '../models/payslipLine.model.js';
import Employee from '../models/employee.model.js';
import Payrun from '../models/payrun.model.js';
import Contract from '../models/contract.model.js';
import SalaryStructure from '../models/salaryStructure.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import { sendEmail } from '../utils/sendEmail.js';
import { payslipEmailTemplate } from '../utils/emailTemplates.js';

const { Op } = Sequelize;

export const getAllPayslips = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, employeeId, status, search } = req.query;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;
  if (search) where.payslipNumber = { [Op.iLike]: `%${search}%` };

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, count } = await Payslip.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName'], include: [] },
      { model: Payrun, as: 'payrun', attributes: ['id', 'name'], include: [] },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  res.status(200).json({
    success: true,
    data: rows,
    meta: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) },
  });
});

export const getPayslipById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const payslip = await Payslip.findByPk(id, {
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'employeeCode', 'firstName', 'lastName', 'email'], include: [] },
      { model: Payrun, as: 'payrun', attributes: ['id', 'name'], include: [] },
      { model: Contract, as: 'contract', attributes: ['id', 'contractNumber', 'wage', 'wageType'], include: [] },
      { model: SalaryStructure, as: 'salaryStructure', attributes: ['id', 'name', 'code'], include: [] },
      { model: PayslipLine, as: 'lines', include: [] },
    ],
  });

  if (!payslip) throw new AppError('Payslip not found', 404);

  res.status(200).json({ success: true, data: payslip });
});

export const getMyPayslips = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) throw new AppError('Employee record not found', 404);

  const payslips = await Payslip.findAll({
    where: { employeeId: employee.id },
    include: [{ model: Payrun, as: 'payrun', attributes: ['id', 'name'], include: [] }],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, count: payslips.length, data: payslips });
});

export const sendPayslipEmail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const payslip = await Payslip.findByPk(id, {
    include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'], include: [] }],
  });

  if (!payslip) throw new AppError('Payslip not found', 404);

  const employee = payslip.employee;
  if (!employee?.email) throw new AppError('Employee email not found', 400);

  const emailResult = await sendEmail({
    email: employee.email,
    subject: `Payslip for ${payslip.periodStart} to ${payslip.periodEnd}`,
    html: payslipEmailTemplate(employee, payslip),
  });

  if (emailResult.success) {
    payslip.emailSentAt = new Date();
    payslip.emailSentTo = employee.email;
    await payslip.save({ hooks: false });
  }

  res.status(200).json({
    success: true,
    message: emailResult.success ? 'Payslip emailed successfully' : 'Failed to send email',
  });
});

export const generatePayslipPDF = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const payslip = await Payslip.findByPk(id);
  if (!payslip) throw new AppError('Payslip not found', 404);

  res.status(200).json({
    success: true,
    message: 'PDF generation ready',
    data: { payslipNumber: payslip.payslipNumber, periodStart: payslip.periodStart, periodEnd: payslip.periodEnd, grossSalary: payslip.grossSalary, netSalary: payslip.netSalary },
  });
});

export const getPayslipLines = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const lines = await PayslipLine.findAll({ where: { payslipId: id }, order: [['sequence', 'ASC']] });
  res.status(200).json({ success: true, count: lines.length, data: lines });
});