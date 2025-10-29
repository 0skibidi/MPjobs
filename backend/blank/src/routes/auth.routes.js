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
        .withMessage('Password is required')
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
exports.default = router;
//# sourceMappingURL=auth.routes.js.map