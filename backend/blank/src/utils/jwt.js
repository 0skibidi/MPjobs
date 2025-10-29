"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistToken = exports.generateEmailVerificationToken = exports.generatePasswordResetToken = exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const ioredis_1 = require("ioredis");
const redis = new ioredis_1.Redis(config_1.config.redisUrl);
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, config_1.config.jwtSecret, { expiresIn: config_1.config.accessTokenExpiry });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, type: 'refresh' }, config_1.config.jwtSecret, { expiresIn: config_1.config.refreshTokenExpiry });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(decoded);
            }
        });
    });
};
exports.verifyToken = verifyToken;
const generatePasswordResetToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'reset' }, config_1.config.jwtSecret, { expiresIn: config_1.config.passwordResetExpiry });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const generateEmailVerificationToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'email_verification' }, config_1.config.jwtSecret, { expiresIn: config_1.config.emailVerificationExpiry });
};
exports.generateEmailVerificationToken = generateEmailVerificationToken;
const blacklistedTokens = new Set();
const blacklistToken = async (token, expiresIn) => {
    blacklistedTokens.add(token);
    setTimeout(() => {
        blacklistedTokens.delete(token);
    }, expiresIn * 1000);
};
exports.blacklistToken = blacklistToken;
//# sourceMappingURL=jwt.js.map