import nodemailer from 'nodemailer';
import { config } from '../config/config';

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: config.emailSecure,
  auth: {
    user: config.emailUser,
    pass: config.emailPassword
  }
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) => {
  const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${config.appName}" <${config.emailFrom}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Hello ${name}</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${config.appName}" <${config.emailFrom}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Hello ${name}</h1>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
};

// For development, log emails instead of sending them
export const sendEmail = async (to: string, subject: string, text: string) => {
  console.log('Email would be sent:', {
    to,
    subject,
    text,
  });
  return true;
};

// Send notification to employer when job is posted
export const sendJobPostNotification = async (
  employerEmail: string,
  employerName: string,
  jobTitle: string,
  jobId: string
) => {
  const jobUrl = `${config.clientUrl}/jobs/${jobId}`;

  await transporter.sendMail({
    from: `"${config.appName}" <${config.emailFrom}>`,
    to: employerEmail,
    subject: 'Your Job Has Been Posted Successfully',
    html: `
      <h1>Hello ${employerName}</h1>
      <p>Great news! Your job listing for <strong>${jobTitle}</strong> has been posted successfully.</p>
      <p>You can view your job posting here:</p>
      <a href="${jobUrl}">View Job Posting</a>
      <p>You can also manage all your job postings from your employer dashboard.</p>
      <p>Thank you for using our platform!</p>
    `
  });
  
  // For development, log the notification
  console.log('Job post notification sent to:', {
    employerEmail,
    jobTitle,
    jobId
  });
}; 