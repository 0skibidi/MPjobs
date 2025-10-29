"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const registerValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('role')
        .trim()
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['employer', 'jobseeker'])
        .withMessage('Invalid role')
];
const loginValidation = [
    (0, express_validator_1.body)('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required'),
    (0, express_validator_1.body)('role')
        .optional()
        .trim()
        .isIn(['admin', 'employer', 'jobseeker'])
        .withMessage('Invalid role if provided')
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('token')
        .trim()
        .notEmpty()
        .withMessage('Token is required')
];
router.use(auth_middleware_1.authRateLimit);
router.post('/register', registerValidation, validate_1.validateRequest, auth_controller_1.register);
router.post('/login', loginValidation, validate_1.validateRequest, auth_controller_1.login);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate_1.validateRequest, auth_controller_1.resetPassword);
router.post('/verify-email', auth_controller_1.verifyEmail);
router.post('/logout', auth_controller_1.logout);
router.get('/debug-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.decode(token);
        res.json({
            message: 'Token debug info',
            decodedToken: decoded,
            tokenString: token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error decoding token', error });
    }
});
router.get('/test-token/:role', (req, res) => {
    try {
        const role = req.params.role.toLowerCase();
        if (!['employer', 'jobseeker', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be employer, jobseeker, or admin' });
        }
        const testUser = {
            _id: 'test-user-id-12345',
            role: role
        };
        const { generateTokens } = require('../utils/jwt');
        const tokens = generateTokens(testUser);
        res.json({
            message: `Test token generated for ${role}`,
            tokens,
            decodedAccessToken: jsonwebtoken_1.default.decode(tokens.accessToken)
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating test token', error });
    }
});
router.get('/create-test-employer', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { User } = require('../models/User');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('testpassword123', salt);
        await User.findOneAndDelete({ email: 'test-employer@example.com' });
        const employer = new User({
            name: 'Test Employer',
            email: 'test-employer@example.com',
            password: hashedPassword,
            companyName: 'Test Company',
            role: 'employer',
            emailVerified: true
        });
        await employer.save();
        const { generateTokens } = require('../utils/jwt');
        const tokens = generateTokens(employer);
        res.json({
            message: 'Test employer created successfully',
            employer: {
                id: employer._id,
                name: employer.name,
                email: employer.email,
                companyName: employer.companyName,
                role: employer.role
            },
            tokens,
            loginInfo: {
                email: 'test-employer@example.com',
                password: 'testpassword123',
                role: 'employer'
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating test employer', error: error.message });
    }
});
router.get('/test-password', async (req, res) => {
    try {
        const { User } = require('../models/User');
        const bcrypt = require('bcryptjs');
        const testPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        const directMatch = await bcrypt.compare(testPassword, hashedPassword);
        const tempUser = {
            password: hashedPassword,
            comparePassword: async (candidatePassword) => {
                return await bcrypt.compare(candidatePassword, hashedPassword);
            }
        };
        const methodMatch = await tempUser.comparePassword(testPassword);
        res.json({
            message: 'Password hashing test',
            testPassword,
            hashedPassword,
            directMatch,
            methodMatch,
            isWorking: directMatch && methodMatch,
            bcryptjs_version: require('bcryptjs').version,
            salt_rounds: 10
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error testing password',
            error: error.message
        });
    }
});
router.get('/test-auth-flow', async (req, res) => {
    try {
        const { User } = require('../models/User');
        const bcrypt = require('bcryptjs');
        const { generateTokens } = require('../utils/jwt');
        const testEmail = `test-user-${Date.now()}@example.com`;
        const testPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        const user = new User({
            name: 'Test User',
            email: testEmail,
            password: hashedPassword,
            role: 'jobseeker',
            emailVerified: true
        });
        user.isNew = true;
        const savedUser = await user.save();
        const loginUser = await User.findOne({ email: testEmail });
        const directMatch = await bcrypt.compare(testPassword, loginUser.password);
        const methodMatch = loginUser.comparePassword
            ? await loginUser.comparePassword(testPassword)
            : 'Method not available';
        const tokens = generateTokens(loginUser);
        res.json({
            message: 'Auth flow test',
            user: {
                id: savedUser._id,
                email: savedUser.email,
                role: savedUser.role
            },
            passwordTests: {
                storedPassword: loginUser.password,
                directMatch,
                methodMatch,
                hasCompareMethod: !!loginUser.comparePassword
            },
            tokens,
            loginInfo: {
                email: testEmail,
                password: testPassword,
                role: 'jobseeker'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error testing auth flow',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map