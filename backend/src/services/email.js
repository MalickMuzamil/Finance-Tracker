import nodemailer from 'nodemailer';
import { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, nodeEnv } from '../config/env.js';

let transporter = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Sends a password reset email to the user with a secure token link.
 */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d1117;
            color: #c9d1d9;
            margin: 0;
            padding: 24px;
          }
          .container {
            max-width: 520px;
            margin: 0 auto;
            background: #161b22;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .brand {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 24px;
          }
          .brand span {
            color: #10b981;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 12px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #8b949e;
            margin: 0 0 18px;
          }
          .btn {
            display: inline-block;
            background: #10b981;
            color: #042f2e !important;
            font-weight: 600;
            font-size: 14px;
            padding: 12px 28px;
            border-radius: 8px;
            text-decoration: none;
            margin: 16px 0 24px;
          }
          .btn:hover {
            background: #059669;
          }
          .url-box {
            background: #0d1117;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            color: #58a6ff;
            word-break: break-all;
            margin-bottom: 24px;
          }
          .footer {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 16px;
            font-size: 12px;
            color: #484f58;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">Fin<span>ance</span> Tracker</div>
          <h1>Password Reset Request</h1>
          <p>Hello ${name || 'User'},</p>
          <p>We received a request to reset your Finance Tracker account password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <div class="url-box">${resetUrl}</div>
          <p><strong>Note:</strong> This link is valid for 1 hour only. If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <div class="footer">
            Finance Tracker • Secure Personal Wealth Management
          </div>
        </div>
      </body>
    </html>
  `;

  // If SMTP is configured, send the real email
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: 'Reset Your Finance Tracker Password',
        text: `Hello ${name || 'User'},\n\nReset your password here: ${resetUrl}\n\nThis link is valid for 1 hour.`,
        html: htmlContent,
      });
      console.log('✅ Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('❌ Failed to send reset email via SMTP:', err);
      // Don't throw fatal error, also log fallback link
    }
  }

  // Fallback for Development or if SMTP is not configured
  console.log('====================================================');
  console.log(`📧 [PASSWORD RESET LINK] For: ${to}`);
  console.log(`🔗 Link: ${resetUrl}`);
  console.log('====================================================');

  return { success: true, devMode: true, resetUrl };
}

export default {
  sendPasswordResetEmail,
};
