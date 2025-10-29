"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenBlacklisted = exports.blacklistToken = exports.generateEmailVerificationToken = exports.generatePasswordResetToken = exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
let redis = null;
try {
    if (config_1.config.redisUrl) {
        const { Redis } = require('ioredis');
        redis = new Redis(config_1.config.redisUrl);
        console.log('Redis connected successfully for token management');
    }
    else {
        console.log('Redis URL not configured, using in-memory token blacklist');
    }
}
catch (error) {
    console.warn('Failed to connect to Redis, using in-memory token blacklist instead:', error);
}
const blacklistedTokens = new Set();
const generateTokens = (user) => {
    try {
        const userId = user._id || user.id;
        if (!userId) {
            console.error('Unable to generate tokens: User ID is missing', user);
            throw new Error('User ID is required for token generation');
        }
        let normalizedRole = user.role;
        if (typeof user.role === 'string') {
            normalizedRole = user.role.toLowerCase();
        }
        console.log('JWT util - Using normalized role for token:', normalizedRole);
        const accessToken = jsonwebtoken_1.default.sign({ userId, role: normalizedRole, type: 'access' }, config_1.config.jwtSecret, { expiresIn: config_1.config.accessTokenExpiry });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, role: normalizedRole, type: 'refresh' }, config_1.config.jwtSecret, { expiresIn: config_1.config.refreshTokenExpiry });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error('Error generating tokens:', error);
        throw error;
    }
};
exports.generateTokens = generateTokens;
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        try {
            const decodedToken = jsonwebtoken_1.default.decode(token);
            console.log('Token being verified:', {
                decodedToken,
                currentTime: new Date(),
                tokenString: token.substring(0, 20) + '...',
            });
            jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, { ignoreExpiration: false }, (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError' && decodedToken && typeof decodedToken === 'object' && decodedToken.exp) {
                        const expDate = new Date(decodedToken.exp * 1000);
                        const now = new Date();
                        console.error('Token expiration issue:', {
                            tokenExpiration: expDate,
                            currentTime: now,
                            tokenIssuedAt: decodedToken.iat ? new Date(decodedToken.iat * 1000) : 'unknown',
                            difference: (expDate.getTime() - now.getTime()) / (1000 * 60 * 60) + ' hours',
                            error: err
                        });
                        if (expDate > now) {
                            console.warn('Token shows future expiration despite error - accepting temporarily.');
                            resolve(decodedToken);
                            return;
                        }
                    }
                    console.error('Token verification failed:', err);
                    reject(err);
                }
                else {
                    console.log('Token verified successfully');
                    resolve(decoded);
                }
            });
        }
        catch (error) {
            console.error('Unexpected error in token verification:', error);
            reject(error);
        }
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
const blacklistToken = async (token, expiresIn) => {
    try {
        if (redis) {
            await redis.set(`blacklist:${token}`, 'true', 'EX', expiresIn);
            console.log('Token blacklisted in Redis');
        }
        else {
            blacklistedTokens.add(token);
            setTimeout(() => {
                blacklistedTokens.delete(token);
            }, expiresIn * 1000);
            console.log('Token blacklisted in memory');
        }
    }
    catch (error) {
        console.error('Error blacklisting token:', error);
        blacklistedTokens.add(token);
        setTimeout(() => {
            blacklistedTokens.delete(token);
        }, expiresIn * 1000);
    }
};
exports.blacklistToken = blacklistToken;
const isTokenBlacklisted = async (token) => {
    try {
        if (redis) {
            const result = await redis.get(`blacklist:${token}`);
            return !!result;
        }
        else {
            return blacklistedTokens.has(token);
        }
    }
    catch (error) {
        console.error('Error checking blacklisted token:', error);
        return blacklistedTokens.has(token);
    }
};
exports.isTokenBlacklisted = isTokenBlacklisted;
//# sourceMappingURL=jwt.js.map