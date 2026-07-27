import { sendVerificationOTPEmail, sendPasswordResetEmail } from '../utils/sendEmail';
import { logger } from '../utils/logger';

export class EmailService {
  async sendVerificationOTP(email: string, otp: string): Promise<void> {
    try {
      await sendVerificationOTPEmail(email, otp);
      logger.info(`Verification OTP sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification OTP to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    try {
      await sendPasswordResetEmail(email, resetToken);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
