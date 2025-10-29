"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const errorHandler_1 = require("./errorHandler");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
            req.user = decoded;
            next();
        }
        catch (error) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.js.map