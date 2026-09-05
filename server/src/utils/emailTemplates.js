/**
 * Email Templates for PeoplePay
 */

// Brand colors
const brandColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
};

// Base email wrapper
const emailWrapper = (content, title = 'PeoplePay') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #e9ecef;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .success-box {
          background: #d4edda;
          border-left: 4px solid #28a745;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PeoplePay</h1>
          <p>HR & Payroll Management System</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated email from PeoplePay. Please do not reply.</p>
          <p>© ${new Date().getFullYear()} PeoplePay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * OTP Email Template
 */
export const otpEmailTemplate = (otp, purpose = 'login') => {
  const purposeText = {
    login: 'Login Verification',
    registration: 'Registration Verification',
    password_reset: 'Password Reset',
    email_verification: 'Email Verification',
    payroll_validation: 'Payroll Validation',
    sensitive_action: 'Security Verification'
  }[purpose] || 'Verification';

  const content = `
    <h2>${purposeText}</h2>
    <p>Hello,</p>
    <p>You have requested a verification code to ${purposeText.toLowerCase()}. Please use the following OTP:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">
        ${otp}
      </div>
      <p style="margin-top: 10px; color: #6c757d;">This OTP will expire in 5 minutes</p>
    </div>
    
    <div class="warning-box">
      <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
    </div>
    
    <p>If you didn't request this, please ignore this email or contact HR immediately.</p>
  `;

  return emailWrapper(content, `${purposeText} - PeoplePay`);
};

/**
 * Welcome Email Template
 */
export const welcomeEmailTemplate = (user) => {
  const content = `
    <h2>Welcome to PeoplePay!</h2>
    <p>Dear ${user.firstName} ${user.lastName || ''},</p>
    
    <p>Your account has been created successfully. Here are your account details:</p>
    
    <div class="info-box">
      <strong>Email:</strong> ${user.email}<br>
      <strong>Employee Code:</strong> ${user.employeeCode || 'N/A'}<br>
      <strong>Department:</strong> ${user.department || 'N/A'}
    </div>
    
    <p>You can now access your HR and payroll information through the PeoplePay portal.</p>
    
    <p>If you have any questions, please contact your HR department.</p>
  `;

  return emailWrapper(content, 'Welcome to PeoplePay');
};

/**
 * Password Reset Success Template
 */
export const passwordResetSuccessTemplate = (user) => {
  const content = `
    <h2>Password Reset Successful</h2>
    <p>Dear ${user.firstName},</p>
    
    <div class="success-box">
      <strong>✓ Your password has been reset successfully.</strong>
    </div>
    
    <p>You can now login with your new password.</p>
    
    <div class="warning-box">
      <strong>Didn't reset your password?</strong> Contact HR immediately.
    </div>
  `;

  return emailWrapper(content, 'Password Reset - PeoplePay');
};

/**
 * Password Change Template
 */
export const passwordChangeTemplate = (user) => {
  const content = `
    <h2>Password Changed Successfully</h2>
    <p>Dear ${user.firstName},</p>
    
    <p>Your password was changed successfully.</p>
    
    <div class="info-box">
      <strong>Date:</strong> ${new Date().toLocaleString()}<br>
      <strong>Account:</strong> ${user.email}
    </div>
    
    <div class="warning-box">
      If you did not change your password, please contact HR immediately.
    </div>
  `;

  return emailWrapper(content, 'Password Changed - PeoplePay');
};

/**
 * Payslip Email Template
 */
export const payslipEmailTemplate = (employee, payslip, attachmentUrl) => {
  const content = `
    <h2>Your Payslip is Ready</h2>
    <p>Dear ${employee.firstName},</p>
    
    <p>Your payslip for the period <strong>${payslip.periodStart}</strong> to <strong>${payslip.periodEnd}</strong> is now available.</p>
    
    <div class="info-box">
      <strong>Payslip Number:</strong> ${payslip.payslipNumber}<br>
      <strong>Gross Salary:</strong> ₹${payslip.grossSalary}<br>
      <strong>Net Salary:</strong> ₹${payslip.netSalary}
    </div>
    
    <p>You can view and download your payslip by clicking the button below:</p>
    
    <a href="${attachmentUrl}" class="button">View Payslip</a>
    
    <p>If you have any questions about your salary, please contact HR.</p>
  `;

  return emailWrapper(content, 'Payslip Available - PeoplePay');
};

/**
 * Leave Request Template
 */
export const leaveRequestTemplate = (employee, leaveRequest) => {
  const content = `
    <h2>Leave Request ${leaveRequest.status}</h2>
    <p>Dear ${employee.firstName},</p>
    
    <p>Your leave request has been <strong>${leaveRequest.status.toLowerCase()}</strong>.</p>
    
    <div class="info-box">
      <strong>Leave Type:</strong> ${leaveRequest.leaveType}<br>
      <strong>From:</strong> ${leaveRequest.startDate}<br>
      <strong>To:</strong> ${leaveRequest.endDate}<br>
      <strong>Duration:</strong> ${leaveRequest.duration} days
    </div>
    
    ${leaveRequest.status === 'REFUSED' ? `
      <div class="warning-box">
        <strong>Reason:</strong> ${leaveRequest.refusalReason || 'Not specified'}
      </div>
    ` : ''}
  `;

  return emailWrapper(content, `Leave Request ${leaveRequest.status} - PeoplePay`);
};

/**
 * Attendance Alert Template
 */
export const attendanceAlertTemplate = (employee, alert) => {
  const content = `
    <h2>Attendance Alert</h2>
    <p>Dear ${employee.firstName},</p>
    
    <div class="warning-box">
      <strong>Alert:</strong> ${alert.message}
    </div>
    
    <div class="info-box">
      <strong>Date:</strong> ${alert.date}<br>
      <strong>Status:</strong> ${alert.status}
    </div>
    
    <p>Please contact HR if you believe this is an error.</p>
  `;

  return emailWrapper(content, 'Attendance Alert - PeoplePay');
};


/**
 * Magic Link Welcome Email Template
 * @param {Object} user - User object
 * @param {string} magicLink - Complete magic link URL
 * @param {number} expiryHours - Expiry time in hours
 */
export const magicLinkWelcomeEmailTemplate = (user, magicLink, expiryHours = 24) => {
  const content = `
    <h2>Welcome to PeoplePay!</h2>
    <p>Dear ${user.firstName} ${user.lastName || ''},</p>
    
    <p>Your account has been created successfully. Here are your account details:</p>
    
    <div class="info-box">
      <strong>Email:</strong> ${user.email}<br>
      <strong>Employee Code:</strong> ${user.employeeCode || 'N/A'}<br>
      <strong>Department:</strong> ${user.department || 'N/A'}
    </div>
    
    <p style="margin-top: 25px;">To activate your account, please set your password by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" class="button" style="font-size: 16px;">Set Your Password</a>
    </div>
    
    <div class="warning-box">
      <strong>Security Notice:</strong><br>
      - This link will expire in ${expiryHours} hours<br>
      - This link can only be used once<br>
      - If you didn't request this, please ignore this email
    </div>
    
    <p style="margin-top: 25px; color: #6c757d; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="color: #667eea; word-break: break-all;">${magicLink}</span>
    </p>
    
    <p>If you have any questions, please contact your HR department.</p>
  `;

  return emailWrapper(content, 'Set Your Password - PeoplePay');
};

/**
 * Magic Link Expired Email Template
 */
export const magicLinkExpiredEmailTemplate = (user, resendLink) => {
  const content = `
    <h2>Password Setup Link Expired</h2>
    <p>Dear ${user.firstName},</p>
    
    <p>Your password setup link has expired. Please click the button below to request a new one:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resendLink}" class="button">Request New Link</a>
    </div>
    
    <div class="warning-box">
      <strong>Note:</strong> For security reasons, password setup links expire after 24 hours.
    </div>
  `;

  return emailWrapper(content, 'Link Expired - PeoplePay');
};
export default {
  otpEmailTemplate,
  welcomeEmailTemplate,
  passwordResetSuccessTemplate,
  passwordChangeTemplate,
  payslipEmailTemplate,
  leaveRequestTemplate,
  attendanceAlertTemplate ,
  magicLinkWelcomeEmailTemplate,      
  magicLinkExpiredEmailTemplate, 
};


