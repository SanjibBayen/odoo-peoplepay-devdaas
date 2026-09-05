import nodemailer from 'nodemailer';

/**
 * Send email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text fallback
 * @param {Array} options.attachments - Array of attachments
 * @param {string} options.cc - CC recipient
 * @param {string} options.bcc - BCC recipient
 * @param {string} options.priority - Email priority (1=High, 3=Normal, 5=Low)
 * @returns {Promise<Object>} Nodemailer info object
 */
export const sendEmail = async (options) => {
  try {
    // Validate required fields
    if (!options.email || !options.subject || !options.html) {
      throw new Error('Email, subject, and html are required');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Connection timeouts
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      // Pooling for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify transporter connection in development
    if (process.env.NODE_ENV === 'development') {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    }

    // Build mail options
    const mailOptions = {
      from: `${process.env.WEB_NAME || 'PeoplePay360'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: options.email,
      cc: options.cc || undefined,
      bcc: options.bcc || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      attachments: options.attachments || [],
      headers: {
        'X-Priority': options.priority || '3',
        'X-Mailer': 'PeoplePay360 Mailer',
        'X-Application': 'PeoplePay360 HR & Payroll System',
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent:');
      console.log('   To:', options.email);
      console.log('   Subject:', options.subject);
      console.log('   Message ID:', info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('   Error:', error.message);
    console.error('   To:', options?.email);
    console.error('   Subject:', options?.subject);

    // Return error object instead of throwing
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send email in background (non-blocking)
 * @param {Object} options - Email options
 * @returns {Promise<void>}
 */
export const sendEmailAsync = async (options) => {
  try {
    const result = await sendEmail(options);
    if (!result.success) {
      console.error('Background email failed:', result.error);
    }
    return result;
  } catch (error) {
    console.error('Background email failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk emails with rate limiting
 * @param {Array} recipients - Array of email options
 * @param {number} batchSize - Number of emails per batch
 * @returns {Promise<Array>} Results array
 */
export const sendBulkEmails = async (recipients, batchSize = 10) => {
  const results = [];
  
  // Process in batches to avoid overwhelming SMTP server
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(recipient => sendEmail(recipient));
    const batchResults = await Promise.allSettled(batchPromises);
    
    results.push(...batchResults);
    
    // Add delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
};

/**
 * Strip HTML tags for plain text fallback
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Create email template wrapper
 * @param {string} content - Email content
 * @param {string} title - Email title
 * @returns {string} Complete HTML email
 */
export const createEmailTemplate = (content, title = 'PeoplePay360') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 30px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated email from PeoplePay360. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} PeoplePay360. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default sendEmail;