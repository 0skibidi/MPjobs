"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const job_controller_1 = require("../controllers/job.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const models_1 = require("../types/models");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.get('/', job_controller_1.getJobs);
router.post('/', job_controller_1.createJob);
router.get('/test', (req, res) => {
    console.log('Test route accessed');
    res.status(200).json({
        status: 'success',
        message: 'API is working properly'
    });
});
router.get('/debug-token', auth_middleware_1.protect, (req, res) => {
    console.log('Debug token route accessed');
    console.log('User in request:', req.user);
    res.status(200).json({
        status: 'success',
        user: req.user,
        message: 'Token debug information'
    });
});
router.get('/check-auth', auth_middleware_1.protect, async (req, res) => {
    var _a;
    try {
        console.log('Check auth endpoint accessed');
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return res.status(401).json({
                status: 'fail',
                message: 'Not authenticated'
            });
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.log('User not found in database');
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('Error in check-auth:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});
router.get('/admin/jobs', job_controller_1.getAdminJobs);
router.patch('/admin/jobs/:id/status', job_controller_1.updateJobStatus);
router.use(auth_middleware_1.protect);
router.get('/applications/user', (0, auth_middleware_1.authorize)(models_1.UserRole.JOBSEEKER), job_controller_1.getUserApplications);
router.get('/applications/:id', job_controller_1.getUserApplication);
router.delete('/applications/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.JOBSEEKER), job_controller_1.withdrawApplication);
router.get('/employer/dashboard', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.getEmployerDashboard);
router.get('/employer', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.getEmployerDashboard);
router.get('/employer/applications', job_controller_1.getEmployerApplications);
router.get('/:id', job_controller_1.getJob);
router.put('/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.updateJob);
router.delete('/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), job_controller_1.deleteJob);
router.post('/:id/apply', job_controller_1.applyForJob);
router.delete('/admin/jobs/:id', (0, auth_middleware_1.authorize)(models_1.UserRole.ADMIN), job_controller_1.deleteJob);
exports.default = router;
//# sourceMappingURL=job.routes.js.map