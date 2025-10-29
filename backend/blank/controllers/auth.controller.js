"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("../middleware/errorHandler");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const config_1 = require("../config/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const generateTokens = (user) => {
    console.log('Auth controller delegating token generation to JWT utils');
    return (0, jwt_1.generateTokens)(user);
};
const register = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    name: !name ? 'Name is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    password: !password ? 'Password is required' : undefined,
                    role: !role ? 'Role is required' : undefined
                }
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const validRoles = ['employer', 'jobseeker', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: 'Invalid role specified',
                validRoles
            });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        if (mongoose_1.default.connection.readyState !== 1) {
            console.error('MongoDB connection not ready, attempting to reconnect');
            try {
                await mongoose_1.default.connect(config_1.config.mongoUri);
            }
            catch (connError) {
                console.error('Failed to reconnect to MongoDB:', connError);
                return res.status(500).json({ message: 'Database connection error, please try again later' });
            }
        }
        let collection;
        try {
            if (role === 'employer') {
                collection = mongoose_1.default.connection.collection('employers');
            }
            else if (role === 'jobseeker') {
                collection = mongoose_1.default.connection.collection('jobseekers');
            }
            else if (role === 'admin') {
                collection = mongoose_1.default.connection.collection('admins');
            }
            else {
                return res.status(400).json({ message: 'Invalid role specified' });
            }
        }
        catch (collectionError) {
            console.error('Error accessing collection:', collectionError);
            return res.status(500).json({
                message: 'Database error while accessing collections',
                details: collectionError.message
            });
        }
        try {
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }
        }
        catch (findError) {
            console.error('Error checking for existing user:', findError);
            return res.status(500).json({
                message: 'Error checking if email already exists',
                details: findError.message
            });
        }
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(role === 'employer' && req.body.companyName && { companyName: req.body.companyName })
        };
        console.log(`Attempting to save user with role ${role}:`, { name, email });
        let userId;
        try {
            const result = await collection.insertOne(userData);
            userId = result.insertedId;
            console.log(`User saved successfully:`, userId);
        }
        catch (insertError) {
            console.error('Error inserting new user:', insertError);
            if (insertError.code === 11000) {
                return res.status(400).json({
                    message: 'Email already exists',
                    details: 'This email is already registered in our system'
                });
            }
            return res.status(500).json({
                message: 'Error creating user account',
                details: insertError.message
            });
        }
        try {
            const userForToken = {
                _id: userId,
                name,
                email,
                role
            };
            const { accessToken, refreshToken } = generateTokens(userForToken);
            if (role === 'employer') {
                try {
                    const companyCollection = mongoose_1.default.connection.collection('companies');
                    const existingCompany = await companyCollection.findOne({ userId: userId });
                    if (!existingCompany) {
                        console.log('Creating default company profile for new employer');
                        const companyData = {
                            name: req.body.companyName || `${name}'s Company`,
                            description: "Company description not provided yet.",
                            userId: userId,
                            location: {
                                street: "",
                                city: "Not specified",
                                state: "Not specified",
                                country: "USA"
                            },
                            industry: "Not specified",
                            website: "https://example.com",
                            verified: false,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        const companyResult = await companyCollection.insertOne(companyData);
                        console.log('Default company profile created with ID:', companyResult.insertedId);
                        await collection.updateOne({ _id: userId }, { $set: { company: companyResult.insertedId } });
                        console.log('Employer record updated with company reference');
                    }
                }
                catch (companyError) {
                    console.error('Error creating default company profile:', companyError);
                }
            }
            return res.status(201).json({
                message: `User registered successfully as ${role}`,
                user: {
                    id: userId,
                    name,
                    email,
                    role
                },
                accessToken,
                refreshToken,
            });
        }
        catch (tokenError) {
            console.error('Error generating authentication tokens:', tokenError);
            return res.status(201).json({
                message: `User registered successfully but token generation failed. Please try logging in.`,
                user: {
                    id: userId,
                    name,
                    email,
                    role
                },
                error: 'Token generation failed'
            });
        }
    }
    catch (error) {
        console.error('Registration error details:', error);
        let statusCode = 500;
        let errorMessage = 'Error registering user';
        if (error.name === 'ValidationError') {
            statusCode = 400;
            errorMessage = 'Validation error';
        }
        else if (error.code === 11000) {
            statusCode = 400;
            errorMessage = 'Email already exists';
        }
        else if (error.name === 'MongoServerError') {
            errorMessage = 'Database error';
        }
        res.status(statusCode).json({
            message: errorMessage,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log('Login attempt:', { email, role });
        const startTime = Date.now();
        if (!role) {
            console.log('No role specified, searching all collections');
            let user = await mongoose_1.default.connection.collection('jobseekers').findOne({ email });
            let userRole = 'jobseeker';
            if (!user) {
                user = await mongoose_1.default.connection.collection('employers').findOne({ email });
                userRole = 'employer';
            }
            if (!user) {
                user = await mongoose_1.default.connection.collection('admins').findOne({ email });
                userRole = 'admin';
            }
            if (user) {
                console.log(`User found in ${userRole} collection:`, user._id);
                console.log('Comparing passwords...');
                const isMatch = await bcryptjs_1.default.compare(password, user.password);
                console.log('Password match:', isMatch);
                if (!isMatch) {
                    console.log('Password does not match for user:', user._id);
                    return res.status(400).json({ message: 'Invalid credentials' });
                }
                const userForToken = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: userRole
                };
                const { accessToken, refreshToken } = generateTokens(userForToken);
                if (userRole === 'employer') {
                    try {
                        const companyCollection = mongoose_1.default.connection.collection('companies');
                        const existingCompany = await companyCollection.findOne({ userId: user._id });
                        if (!existingCompany) {
                            console.log('Creating default company profile for existing employer');
                            const companyData = {
                                name: `${user.name}'s Company`,
                                description: "Company description not provided yet.",
                                userId: user._id,
                                location: {
                                    street: "",
                                    city: "Not specified",
                                    state: "Not specified",
                                    country: "USA"
                                },
                                industry: "Not specified",
                                website: "https://example.com",
                                verified: false,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };
                            const companyResult = await companyCollection.insertOne(companyData);
                            console.log('Default company profile created with ID:', companyResult.insertedId);
                            await mongoose_1.default.connection.collection('employers').updateOne({ _id: user._id }, { $set: { company: companyResult.insertedId } });
                            console.log('Employer record updated with company reference');
                        }
                    }
                    catch (companyError) {
                        console.error('Error creating/checking company profile:', companyError);
                    }
                }
                const endTime = Date.now();
                console.log(`Login completed in ${endTime - startTime}ms`);
                return res.json({
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
        }
        let collection;
        if (role === 'employer') {
            collection = mongoose_1.default.connection.collection('employers');
        }
        else if (role === 'jobseeker') {
            collection = mongoose_1.default.connection.collection('jobseekers');
        }
        else if (role === 'admin') {
            collection = mongoose_1.default.connection.collection('admins');
        }
        else {
            return res.status(400).json({ message: 'Invalid role specified' });
        }
        const user = await collection.findOne({ email });
        if (!user) {
            console.log('User not found for:', { email, role });
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('Comparing passwords...');
        console.log('Password from request:', password);
        console.log('Stored hashed password:', user.password);
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        console.log('Password match:', isMatch);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const userForToken = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role
        };
        const { accessToken, refreshToken } = generateTokens(userForToken);
        const endTime = Date.now();
        console.log(`Login completed in ${endTime - startTime}ms`);
        return res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
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
        let collection;
        if (decoded.role === 'employer') {
            collection = mongoose_1.default.connection.collection('employers');
        }
        else if (decoded.role === 'jobseeker') {
            collection = mongoose_1.default.connection.collection('jobseekers');
        }
        else if (decoded.role === 'admin') {
            collection = mongoose_1.default.connection.collection('admins');
        }
        else {
            return next(new errorHandler_1.AppError('Invalid role in token', 400));
        }
        const user = await collection.findOne({ _id: new mongoose_1.default.Types.ObjectId(decoded.userId) });
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
        const user = await User_1.User.findOne({ email });
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
        const user = await User_1.User.findById(decoded.userId);
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
        const user = await User_1.User.findByIdAndUpdate(decoded.userId, { emailVerified: true }, { new: true });
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
        if (!refreshToken) {
            return next(new errorHandler_1.AppError('Refresh token is required', 400));
        }
        await (0, jwt_1.blacklistToken)(refreshToken);
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map