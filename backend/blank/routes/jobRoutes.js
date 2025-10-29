"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const jobController_1 = require("../controllers/jobController");
const router = express_1.default.Router();
router.get('/jobs', jobController_1.getAllJobs);
router.post('/jobs/:id/apply', auth_1.protect, (0, auth_1.authorize)('jobseeker'), upload_1.upload.single('resume'), jobController_1.applyForJob);
router.post('/jobs', auth_1.protect, (0, auth_1.authorize)('employer'), jobController_1.createJob);
router.get('/employer/jobs', auth_1.protect, (0, auth_1.authorize)('employer'), jobController_1.getEmployerJobs);
router.patch('/jobs/:jobId/applications/:applicationId', auth_1.protect, (0, auth_1.authorize)('employer'), jobController_1.updateApplicationStatus);
router.get('/admin/jobs', auth_1.protect, (0, auth_1.authorize)('admin'), jobController_1.getAdminJobs);
router.patch('/admin/jobs/:id/status', auth_1.protect, (0, auth_1.authorize)('admin'), jobController_1.updateJobStatus);
exports.default = router;
//# sourceMappingURL=jobRoutes.js.map