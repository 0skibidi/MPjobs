"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const job_controller_1 = require("../controllers/job.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_1 = require("../middleware/validate");
const upload_1 = require("../utils/upload");
const models_1 = require("../types/models");
const router = express_1.default.Router();
const jobValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ max: 100 })
        .withMessage('Job title cannot exceed 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .notEmpty()
        .withMessage('Job description is required')
        .isLength({ max: 5000 })
        .withMessage('Description cannot exceed 5000 characters'),
    (0, express_validator_1.body)('requirements')
        .isArray()
        .withMessage('Requirements must be an array'),
    (0, express_validator_1.body)('location')
        .isObject()
        .withMessage('Location must be an object')
        .custom((value) => {
        if (!value.city || !value.state || !value.country) {
            throw new Error('City, state, and country are required');
        }
        return true;
    }),
    (0, express_validator_1.body)('salaryRange')
        .isObject()
        .withMessage('Salary range must be an object')
        .custom((value) => {
        if (!value.min || !value.max || value.min > value.max) {
            throw new Error('Invalid salary range');
        }
        return true;
    }),
    (0, express_validator_1.body)('jobType')
        .trim()
        .notEmpty()
        .withMessage('Job type is required')
        .isIn(Object.values(models_1.JobType))
        .withMessage('Invalid job type'),
    (0, express_validator_1.body)('applicationDeadline')
        .trim()
        .notEmpty()
        .withMessage('Application deadline is required')
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value) => {
        if (new Date(value) <= new Date()) {
            throw new Error('Application deadline must be in the future');
        }
        return true;
    }),
    (0, express_validator_1.body)('skills')
        .isArray()
        .withMessage('Skills must be an array')
        .custom((value) => {
        if (!value.length) {
            throw new Error('At least one skill is required');
        }
        return true;
    })
];
router.get('/', job_controller_1.getJobs);
router.get('/:id', job_controller_1.getJob);
router.use(auth_middleware_1.protect);
router.post('/', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), jobValidation, validate_1.validate, job_controller_1.createJob);
router.put('/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), jobValidation, validate_1.validate, job_controller_1.updateJob);
router.delete('/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.deleteJob);
router.get('/employer/dashboard', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.getEmployerDashboard);
router.post('/:id/apply', (0, auth_middleware_1.authorize)(models_1.UserRole.JOBSEEKER), upload_1.uploadResume, job_controller_1.applyForJob);
exports.default = router;
//# sourceMappingURL=job.routes.js.map