"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mpjobs',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    passwordResetExpiry: '1h',
    emailVerificationExpiry: '24h',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    emailService: {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    },
};
//# sourceMappingURL=config.js.map