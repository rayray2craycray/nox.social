/**
 * Email Service
 * Handles sending emails using nodemailer
 */

const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send business email verification email
 */
exports.sendVerificationEmail = async (email, venueName, verificationUrl) => {
  try {
    const transporter = createTransporter();

    // If no SMTP configured, log to console (dev mode)
    if (!transporter) {
      console.log('\n===========================================');
      console.log('📧 EMAIL VERIFICATION (DEV MODE)');
      console.log('===========================================');
      console.log(`To: ${email}`);
      console.log(`Venue: ${venueName}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('===========================================\n');
      return { success: true, mode: 'dev' };
    }

    // HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
    }
    .header {
      text-align: center;
      padding: 30px 20px;
      background: linear-gradient(135deg, #ff0080 0%, #cc0066 100%);
      color: white;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: #ff0080;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .button:hover {
      background: #cc0066;
    }
    .url-box {
      word-break: break-all;
      color: #666;
      background: #fff;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      margin: 15px 0;
    }
    .features {
      margin: 20px 0;
    }
    .features li {
      margin: 10px 0;
      color: #555;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
    .footer a {
      color: #ff0080;
      text-decoration: none;
    }
    .expiry {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Verify Your Business Email</h1>
  </div>
  <div class="content">
    <h2>Welcome to Rork Nightlife, ${venueName}!</h2>

    <p>Thank you for registering your business. To complete your registration and become the <strong>Head Moderator</strong> of your venue's profile, please verify your email address.</p>

    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <div class="url-box">${verificationUrl}</div>

    <p><strong>What happens next?</strong></p>
    <ul class="features">
      <li>✅ You'll become the <strong>Head Moderator</strong> of ${venueName}</li>
      <li>✅ Full access to edit venue information and display</li>
      <li>✅ Ability to manage events, tickets, and guest lists</li>
      <li>✅ Permission to add and manage staff members</li>
      <li>✅ Access to venue analytics and insights</li>
    </ul>

    <div class="expiry">
      <strong>⏱️ This link expires in 24 hours.</strong><br>
      If it expires, you can request a new verification email from your profile.
    </div>

    <p>If you didn't request this verification, please ignore this email.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The Rork Nightlife Team</strong>
    </p>
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} Rork Nightlife. All rights reserved.</p>
    <p>Questions? Contact us at <a href="mailto:support@nox.social">support@nox.social</a></p>
  </div>
</body>
</html>
    `;

    // Text fallback
    const textContent = `
Welcome to Rork Nightlife, ${venueName}!

Thank you for registering your business. To complete your registration and become the Head Moderator of your venue's profile, please verify your email address.

Verification URL: ${verificationUrl}

What happens next?
- You'll become the Head Moderator of ${venueName}
- Full access to edit venue information and display
- Ability to manage events, tickets, and guest lists
- Permission to add and manage staff members
- Access to venue analytics and insights

This link expires in 24 hours.

If you didn't request this verification, please ignore this email.

Best regards,
The Rork Nightlife Team

Questions? Contact us at support@nox.social
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Rork Nightlife" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Verify your business email for ${venueName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✅ Verification email sent to ${email}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

/**
 * Send password reset email (for future use)
 */
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`Password reset email would be sent to: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    return { success: true, mode: 'dev' };
  }

  // Implementation similar to verification email
  // ... (can be added when needed)
};

/**
 * Send welcome email after successful verification
 */
exports.sendWelcomeEmail = async (email, venueName) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`Welcome email would be sent to: ${email}`);
    return { success: true, mode: 'dev' };
  }

  // Implementation can be added when needed
};

module.exports = exports;
