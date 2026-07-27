import nodemailer from 'nodemailer';
import { env } from './env';

export const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const verifyTransporter = async (): Promise<void> => {
  try {
    await transporter.verify();
  } catch {
    console.warn('Email transporter not configured');
  }
};
