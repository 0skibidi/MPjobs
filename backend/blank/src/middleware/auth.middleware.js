"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = exports.authRateLimit = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const express_rate_limit_1 = require("express-rate-limit");
exports.authRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        const token = authHeader.split(' ')[1];
        const decoded = await (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'access') {
            return next(new errorHandler_1.AppError('Invalid access token', 401));
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        next(new errorHandler_1.AppError('Not authorized to access this route', 401));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map