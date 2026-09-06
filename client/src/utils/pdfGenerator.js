/**
 * Pure JavaScript PDF Generator for PeoplePay documents.
 * Produces valid, downloadable PDF-1.4 binary documents without external heavy dependencies.
 */

function sanitizeText(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates and triggers download of a professional PeoplePay salary payslip PDF.
 *
 * @param {Object} slip - Payslip data object
 * @returns {Promise<boolean>}
 */
export async function downloadPayslipPdf(slip) {
  if (!slip) throw new Error('Payslip data is missing');

  const emp = slip.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : slip.employeeName || 'Employee';
  const empCode = emp.employeeCode || slip.employeeId || 'EMP-000';
  const deptName = emp.department?.name || emp.department || 'General';
  const posName = emp.jobPosition?.name || emp.jobPosition || 'Staff';
  const slipNumber = slip.payslipNumber || `PS-${slip.id?.slice(-6) || '000000'}`;
  const period = slip.periodStart
    ? `${slip.periodStart} to ${slip.periodEnd}`
    : 'Current Period';

  const grossSalary = Number(slip.grossSalary || 0).toLocaleString('en-IN');
  const totalDeductions = Number(slip.totalDeductions || 0).toLocaleString('en-IN');
  const netSalary = Number(slip.netSalary || 0).toLocaleString('en-IN');

  const lines = slip.lines || [];
  const earnings = lines.length > 0
    ? lines.filter((l) => ['BASIC', 'ALLOWANCE', 'GROSS'].includes(l.category))
    : [{ name: 'Gross Salary', amount: Number(slip.grossSalary || 0) }];

  const deductions = lines.length > 0
    ? lines.filter((l) => ['DEDUCTION', 'TAX', 'CONTRIBUTION'].includes(l.category))
    : [{ name: 'Total Deductions', amount: Number(slip.totalDeductions || 0) }];

  // Build PDF-1.4 content stream
  const streamLines = [
    // Header background banner
    '0.443 0.294 0.404 rg', // PeoplePay purple (#714B67)
    '40 730 515 55 re f',
    
    // Header Title
    '1 1 1 rg', // White
    'BT',
    '/F2 20 Tf',
    '55 752 Td',
    '(PEOPLEPAY SALARY PAYSLIP) Tj',
    'ET',
    
    'BT',
    '/F1 10 Tf',
    '55 738 Td',
    '(Official Remuneration Advice) Tj',
    'ET',

    // Slip Number on Header right
    'BT',
    '/F2 10 Tf',
    '420 752 Td',
    `(${sanitizeText(slipNumber)}) Tj`,
    'ET',

    'BT',
    '/F1 9 Tf',
    '420 738 Td',
    `(${sanitizeText(period)}) Tj`,
    'ET',

    // Employee Information Box
    '0.95 0.95 0.94 rg', // Light background box
    '40 645 515 70 re f',
    '0.8 0.8 0.8 RG',
    '0.5 w',
    '40 645 515 70 re S',

    '0.12 0.16 0.23 rg', // Dark slate text (#1E293B)
    'BT',
    '/F2 10 Tf',
    '55 695 Td',
    '(EMPLOYEE INFORMATION) Tj',
    'ET',

    'BT',
    '/F1 9 Tf',
    '55 675 Td',
    `(Name: ${sanitizeText(empName)}) Tj`,
    'ET',

    'BT',
    '/F1 9 Tf',
    '55 658 Td',
    `(Employee ID: ${sanitizeText(empCode)}) Tj`,
    'ET',

    'BT',
    '/F1 9 Tf',
    '300 675 Td',
    `(Department: ${sanitizeText(deptName)}) Tj`,
    'ET',

    'BT',
    '/F1 9 Tf',
    '300 658 Td',
    `(Job Position: ${sanitizeText(posName)}) Tj`,
    'ET',

    // Earnings Header
    '0.2 0.2 0.2 rg',
    'BT',
    '/F2 11 Tf',
    '55 615 Td',
    '(EARNINGS & ALLOWANCES) Tj',
    'ET',

    '0.7 0.7 0.7 RG',
    '40 605 515 0.5 re f',
  ];

  // Render Earnings items
  let curY = 590;
  earnings.slice(0, 8).forEach((item) => {
    const amt = Number(item.amount || 0).toLocaleString('en-IN');
    streamLines.push(
      'BT',
      '/F1 9 Tf',
      `55 ${curY} Td`,
      `(${sanitizeText(item.name || item.code || 'Allowance')}) Tj`,
      'ET',
      'BT',
      '/F2 9 Tf',
      `480 ${curY} Td`,
      `(Rs. ${sanitizeText(amt)}) Tj`,
      'ET'
    );
    curY -= 16;
  });

  // Deductions Header
  curY -= 10;
  streamLines.push(
    '0.2 0.2 0.2 rg',
    'BT',
    '/F2 11 Tf',
    `55 ${curY} Td`,
    '(STATUTORY & OTHER DEDUCTIONS) Tj',
    'ET',
    '0.7 0.7 0.7 RG',
    `40 ${curY - 8} 515 0.5 re f`
  );

  curY -= 25;
  deductions.slice(0, 8).forEach((item) => {
    const amt = Number(item.amount || 0).toLocaleString('en-IN');
    streamLines.push(
      'BT',
      '/F1 9 Tf',
      `55 ${curY} Td`,
      `(${sanitizeText(item.name || item.code || 'Deduction')}) Tj`,
      'ET',
      'BT',
      '/F2 9 Tf',
      `480 ${curY} Td`,
      `(Rs. ${sanitizeText(amt)}) Tj`,
      'ET'
    );
    curY -= 16;
  });

  // Summary Totals Box
  curY -= 15;
  streamLines.push(
    '0.96 0.97 0.98 rg',
    `40 ${curY - 50} 515 55 re f`,
    '0.8 0.8 0.8 RG',
    `40 ${curY - 50} 515 55 re S`,

    // Gross
    'BT',
    '/F1 9 Tf',
    `55 ${curY - 18} Td`,
    `(Gross Earnings: Rs. ${sanitizeText(grossSalary)}) Tj`,
    'ET',

    // Deductions
    'BT',
    '/F1 9 Tf',
    `55 ${curY - 36} Td`,
    `(Total Deductions: Rs. ${sanitizeText(totalDeductions)}) Tj`,
    'ET',

    // Net Pay Highlight
    '0.443 0.294 0.404 rg',
    'BT',
    '/F2 14 Tf',
    `320 ${curY - 28} Td`,
    `(NET PAY: Rs. ${sanitizeText(netSalary)}) Tj`,
    'ET'
  );

  // Footer Note
  streamLines.push(
    '0.5 0.5 0.5 rg',
    'BT',
    '/F1 8 Tf',
    '160 50 Td',
    '(This is a computer generated payslip from PeoplePay HR & Payroll Platform.) Tj',
    'ET'
  );

  const streamContent = streamLines.join('\n');
  const streamLength = streamContent.length;

  // Build complete standard PDF structure
  const pdfBody = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length ${streamLength} >>`,
    'stream',
    streamContent,
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    '6 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    'endobj',
    'xref',
    '0 7',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000244 00000 n ',
    `0000000${String(300 + streamLength).padStart(3, '0')} 00000 n `,
    `0000000${String(368 + streamLength).padStart(3, '0')} 00000 n `,
    'trailer',
    '<< /Size 7 /Root 1 0 R >>',
    'startxref',
    String(440 + streamLength),
    '%%EOF',
  ].join('\n');

  const blob = new Blob([pdfBody], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanEmp = (emp.employeeCode || empName || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanPeriod = (slip.periodStart && slip.periodEnd ? `${slip.periodStart}_to_${slip.periodEnd}` : period).replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `PeoplePay_Payslip_${cleanEmp}_${cleanPeriod}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export default {
  downloadPayslipPdf,
};
