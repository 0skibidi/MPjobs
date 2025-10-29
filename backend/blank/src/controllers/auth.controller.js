"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.login = exports.register = void 0;
const employer_model_1 = require("../models/employer.model");
const jobseeker_model_1 = require("../models/jobseeker.model");
const errorHandler_1 = require("../middleware/errorHandler");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const generateTokens = (user) => {
    try {
        console.log('Generating tokens for user:', user._id);
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
        console.log('Tokens generated successfully');
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error('Error generating tokens:', error);
        throw error;
    }
};
const register = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { name, email, password, role } = req.body;
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        let user;
        if (role === 'employer') {
            const existingEmployer = await employer_model_1.Employer.findOne({ email });
            if (existingEmployer) {
                return res.status(400).json({ message: 'Email already registered as an employer' });
            }
            user = new employer_model_1.Employer({
                name,
                email,
                password: hashedPassword,
                companyName: req.body.companyName || name
            });
        }
        else {
            const existingJobseeker = await jobseeker_model_1.Jobseeker.findOne({ email });
            if (existingJobseeker) {
                return res.status(400).json({ message: 'Email already registered as a jobseeker' });
            }
            user = new jobseeker_model_1.Jobseeker({
                name,
                email,
                password: hashedPassword
            });
        }
        console.log(`Attempting to save ${role}:`, { name, email });
        await user.save();
        console.log(`${role} saved successfully:`, user._id);
        const { accessToken, refreshToken } = generateTokens({ ...user.toObject(), role });
        res.status(201).json({
            message: `${role} registered successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: role
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Registration error details:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: Object.values(error.errors).map((err) => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            message: 'Server error during registration',
            error: error.message
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user;
        let userRole;
        if (role === 'employer') {
            user = await employer_model_1.Employer.findOne({ email });
            userRole = 'employer';
        }
        else {
            user = await jobseeker_model_1.Jobseeker.findOne({ email });
            userRole = 'jobseeker';
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (role !== userRole) {
            return res.status(403).json({
                message: `This account is registered as a ${userRole}, not as a ${role}`
            });
        }
        const { accessToken, refreshToken } = generateTokens({ ...user.toObject(), role: userRole });
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: userRole
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const decoded = await (0, jwt_1.verifyToken)(refreshToken);
        if (decoded.type !== 'refresh') {
            return next(new errorHandler_1.AppError('Invalid refresh token', 401));
        }
        const user = await employer_model_1.Employer.findById(decoded.userId) || await jobseeker_model_1.Jobseeker.findById(decoded.userId);
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        const tokens = generateTokens(user);
        await (0, jwt_1.blacklistToken)(refreshToken, 60 * 60 * 24 * 7);
        res.status(200).json({
            status: 'success',
            data: tokens
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await employer_model_1.Employer.findOne({ email }) || await jobseeker_model_1.Jobseeker.findOne({ email });
        if (!user) {
            return next(new errorHandler_1.AppError('No user found with this email', 404));
        }
        const resetToken = (0, jwt_1.generatePasswordResetToken)(user._id);
        await (0, email_1.sendPasswordResetEmail)(email, user.name, resetToken);
        res.status(200).json({
            status: 'success',
            message: 'Password reset email sent'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const decoded = await (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'reset') {
            return next(new errorHandler_1.AppError('Invalid reset token', 401));
        }
        const user = await employer_model_1.Employer.findById(decoded.userId) || await jobseeker_model_1.Jobseeker.findById(decoded.userId);
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        user.password = password;
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Password reset successful'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const decoded = await (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'email_verification') {
            return next(new errorHandler_1.AppError('Invalid verification token', 401));
        }
        const user = await employer_model_1.Employer.findByIdAndUpdate(decoded.userId, { emailVerified: true }, { new: true }) || await jobseeker_model_1.Jobseeker.findByIdAndUpdate(decoded.userId, { emailVerified: true }, { new: true });
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await (0, jwt_1.blacklistToken)(refreshToken, 60 * 60 * 24 * 7);
        }
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map