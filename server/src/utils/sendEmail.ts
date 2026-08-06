import { transporter } from '../config/nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const buildFrom = (): string => {
  if (env.emailFrom.includes('<') && env.emailFrom.includes('>')) {
    return env.emailFrom;
  }
  return `"NextEra LMS" <${env.emailFrom}>`;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: buildFrom(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  logger.info(`[Email] Sending to=${options.to} subject="${options.subject}" from=${env.emailFrom}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `[Email] Accepted to=${options.to} subject="${options.subject}" ` +
        `accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} ` +
        `response="${info.response}" messageId=${info.messageId}`,
    );
  } catch (error) {
    logger.error(
      `[Email] Failed to=${options.to} subject="${options.subject}" ` +
        `code=${(error as any)?.code} command=${(error as any)?.command} ` +
        `response=${JSON.stringify((error as any)?.response)} message=${(error as any)?.message}`,
    );
    throw error;
  }
};

export const sendVerificationOTPEmail = async (email: string, otp: string): Promise<void> => {
  const text = [
    'NextEra LMS - Email Verification',
    '',
    `Your email verification OTP is: ${otp}`,
    'This OTP will expire in 10 minutes.',
    'If you did not request this, please ignore this email.',
  ].join('\n');

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
    text,
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${env.clientUrl}/auth/reset-password?token=${resetToken}`;

  const text = [
    'NextEra LMS - Password Reset',
    '',
    `You requested a password reset. Click the link below to reset your password:`,
    resetUrl,
    'This link will expire in 15 minutes.',
    'If you did not request this, please ignore this email.',
  ].join('\n');

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
    text,
    html,
  });
};

export const sendInstructorDecisionEmail = async (options: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  reason?: string;
}): Promise<void> => {
  const isApproved = options.status === 'approved';
  const dashboardUrl = `${env.clientUrl}/instructor/dashboard`;
  const applyUrl = `${env.clientUrl}/instructor/apply`;

  const heading = isApproved
    ? 'Congratulations! Your application to become an instructor has been approved.'
    : 'Update on your instructor application';

  const body = isApproved
    ? 'You can now create and publish courses, manage your curriculum, and track your earnings from your instructor dashboard.'
    : `Unfortunately, your application was not approved at this time.${options.reason ? `\n\nReason: ${options.reason}` : ''}\n\nYou are welcome to review the requirements and reapply.`;

  const text = [
    'NextEra LMS - Instructor Application',
    '',
    `Hi ${options.name},`,
    '',
    heading,
    '',
    body,
    '',
    isApproved ? `Get started: ${dashboardUrl}` : `Reapply: ${applyUrl}`,
    '',
    'If you have any questions, please contact our support team.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">NextEra LMS - Instructor Application</h2>
      <p>Hi ${options.name},</p>
      <p>${heading}</p>
      ${isApproved
        ? `<p>You can now create and publish courses, manage your curriculum, and track your earnings from your instructor dashboard.</p>`
        : `<p>Unfortunately, your application was not approved at this time.</p>
           ${options.reason ? `<p style="background: #fef2f2; padding: 12px; border-radius: 8px; color: #b91c1c;">Reason: ${options.reason}</p>` : ''}
           <p>You are welcome to review the requirements and reapply.</p>`}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${isApproved ? dashboardUrl : applyUrl}"
           style="background: ${isApproved ? '#f97316' : '#6b7280'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
          ${isApproved ? 'Go to Instructor Dashboard' : 'Reapply'}
        </a>
      </div>
      <p>If you have any questions, please contact our support team.</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">&copy; 2026 NextEra LMS. All rights reserved.</p>
    </div>
  `;

  await sendEmail({
    to: options.email,
    subject: isApproved
      ? 'NextEra LMS - Your instructor application was approved'
      : 'NextEra LMS - Update on your instructor application',
    text,
    html,
  });
};
