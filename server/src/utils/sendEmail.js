import nodemailer from 'nodemailer';

// Send email utility function
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Build mail options
    const mailOptions = {
      from: `${process.env.WEB_NAME || 'PeoplePay'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: options.email,
      cc: options.cc || undefined,
      bcc: options.bcc || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      attachments: options.attachments || [],
      headers: {
        'X-Priority': options.priority || '3',
        'X-Mailer': 'PeoplePay Mailer',
        'X-Application': 'PeoplePay HR & Payroll System',
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent:');
      console.log('  To:', options.email);
      console.log('  Subject:', options.subject);
      console.log('  Message ID:', info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('Email sending failed:');
    console.error('  Error:', error.message);
    console.error('  To:', options?.email);
    console.error('  Subject:', options?.subject);

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send email in background 
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
 */
export const sendBulkEmails = async (recipients, batchSize = 10) => {
  const results = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchPromises = batch.map(recipient => sendEmail(recipient));
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
};

/**
 * Strip HTML tags for plain text fallback
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default sendEmail;