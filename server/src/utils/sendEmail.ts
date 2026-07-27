import { transporter } from '../config/nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"NextEra LMS" <${env.emailFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

export const sendVerificationOTPEmail = async (email: string, otp: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">NextEra LMS - Email Verification</h2>
      <p>Thank you for registering! Your email verification OTP is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #f97316; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">&copy; 2026 NextEra LMS. All rights reserved.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'NextEra LMS - Email Verification',
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${env.clientUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">NextEra LMS - Password Reset</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">&copy; 2026 NextEra LMS. All rights reserved.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'NextEra LMS - Password Reset',
    html,
  });
};
