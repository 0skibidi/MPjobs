"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const getEnv = (key, defaultValue) => {
    const value = process.env[key];
    if (!value) {
        console.log(`Environment variable ${key} not found, using default: ${defaultValue}`);
        return defaultValue;
    }
    return value;
};
const buildMongoUri = () => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }
    const host = getEnv('MONGO_HOST', 'localhost');
    const port = getEnv('MONGO_PORT', '27017');
    const db = getEnv('MONGO_DB', 'fbla_job_board');
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS;
    if (user && pass) {
        return `mongodb://${user}:${pass}@${host}:${port}/${db}`;
    }
    return `mongodb://${host}:${port}/${db}`;
};
exports.config = {
    port: getEnv('PORT', '5008'),
    mongoUri: buildMongoUri(),
    jwtSecret: getEnv('JWT_SECRET', 'fallback-secret-key-for-development-only'),
    accessTokenExpiry: getEnv('JWT_ACCESS_EXPIRY', '24h'),
    refreshTokenExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
    passwordResetExpiry: getEnv('PASSWORD_RESET_EXPIRY', '1h'),
    emailVerificationExpiry: getEnv('EMAIL_VERIFICATION_EXPIRY', '24h'),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:5174'),
    redisUrl: process.env.REDIS_URL || null,
    emailService: {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    },
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production'
};
console.log('Server configuration loaded:', {
    port: exports.config.port,
    mongoDbHost: ((_a = exports.config.mongoUri.split('@').pop()) === null || _a === void 0 ? void 0 : _a.split('/')[0]) || 'unknown',
    mongoDbName: exports.config.mongoUri.split('/').pop() || 'unknown',
    hasRedis: !!exports.config.redisUrl,
    corsOrigin: exports.config.corsOrigin,
    environment: process.env.NODE_ENV || 'development'
});
//# sourceMappingURL=config.js.map