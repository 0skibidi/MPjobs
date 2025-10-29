"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = exports.authRateLimit = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const express_rate_limit_1 = require("express-rate-limit");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.authRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            console.warn('No authorization header or incorrect format');
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        const token = authHeader.split(' ')[1];
        if (!token || token.length < 10) {
            console.warn('Invalid token format in header');
            return next(new errorHandler_1.AppError('Invalid authentication token', 401));
        }
        try {
            const rawDecoded = jsonwebtoken_1.default.decode(token);
            console.log('Token before verification:', {
                path: req.path,
                method: req.method,
                tokenInfo: rawDecoded ? {
                    exp: rawDecoded.exp ? new Date(rawDecoded.exp * 1000).toISOString() : 'none',
                    role: rawDecoded.role || 'none',
                    type: rawDecoded.type || 'none'
                } : 'Could not decode'
            });
            const decoded = await (0, jwt_1.verifyToken)(token);
            console.log('Token verified in protect middleware:', {
                userId: decoded.userId || decoded.id,
                role: decoded.role,
                type: decoded.type
            });
            const userId = decoded.userId || decoded.id;
            if (!userId) {
                console.error('No user ID found in token:', decoded);
                return next(new errorHandler_1.AppError('Invalid token format - missing user ID', 401));
            }
            if (decoded.type && decoded.type !== 'access') {
                console.error('Token type mismatch:', decoded.type);
                return next(new errorHandler_1.AppError('Invalid access token type', 401));
            }
            req.user = {
                userId: userId,
                role: decoded.role
            };
            console.log('User set in request:', req.user);
            next();
        }
        catch (verifyError) {
            console.error('Token verification error:', {
                name: verifyError.name,
                message: verifyError.message,
                expiredAt: verifyError.expiredAt,
                path: req.path
            });
            if (verifyError.name === 'TokenExpiredError') {
                return next(new errorHandler_1.AppError('Your session has expired. Please log in again.', 401));
            }
            else if (verifyError.name === 'JsonWebTokenError') {
                return next(new errorHandler_1.AppError('Invalid authentication token. Please log in again.', 401));
            }
            return next(new errorHandler_1.AppError('Authentication failed. Please log in again.', 401));
        }
    }
    catch (error) {
        console.error('Auth middleware error:', {
            error: error.message,
            stack: error.stack,
            path: req.path
        });
        next(new errorHandler_1.AppError('Authentication error. Please try again later.', 500));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        const roleValues = roles.map(role => role.toString().toLowerCase());
        const userRole = req.user.role.toString().toLowerCase();
        console.log('Authorization check:', {
            userRole,
            allowedRoles: roleValues
        });
        if (!roleValues.includes(userRole)) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map