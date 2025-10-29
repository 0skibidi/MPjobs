"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config/config");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.emailHost,
    port: config_1.config.emailPort,
    secure: config_1.config.emailSecure,
    auth: {
        user: config_1.config.emailUser,
        pass: config_1.config.emailPassword
    }
});
const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl = `${config_1.config.clientUrl}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"${config_1.config.appName}" <${config_1.config.emailFrom}>`,
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
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${config_1.config.clientUrl}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: `"${config_1.config.appName}" <${config_1.config.emailFrom}>`,
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
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendEmail = async (to, subject, text) => {
    console.log('Email would be sent:', {
        to,
        subject,
        text,
    });
    return true;
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map