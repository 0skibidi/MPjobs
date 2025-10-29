"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.applyForJob = exports.updateJobStatus = exports.getAdminJobs = exports.getEmployerJobs = exports.getAllJobs = exports.createJob = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const JobApplication_1 = __importDefault(require("../models/JobApplication"));
const enums_1 = require("../types/enums");
const s3_1 = require("../utils/s3");
const createJob = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        console.log('Received job data:', req.body);
        const { title, company, description, requirements, location, jobType, salaryMin, salaryMax } = req.body;
        if (!title || !company || !description || !location || !jobType || salaryMin === undefined || salaryMax === undefined) {
            console.log('Missing required fields:', {
                title: !title,
                company: !company,
                description: !description,
                location: !location,
                jobType: !jobType,
                salaryMin: salaryMin === undefined,
                salaryMax: salaryMax === undefined
            });
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        if (Number(salaryMin) < 0 || Number(salaryMax) < 0 || Number(salaryMax) < Number(salaryMin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid salary range'
            });
        }
        const jobData = {
            title,
            company: {
                id: userId,
                name: company,
                logo: req.body.logo || ''
            },
            description,
            requirements: Array.isArray(requirements) ? requirements : [requirements].filter(Boolean),
            location: {
                city: location,
                state: location,
                country: 'US',
                remote: req.body.remote || false
            },
            salary: {
                min: Number(salaryMin),
                max: Number(salaryMax),
                currency: 'USD'
            },
            jobType,
            status: enums_1.JobStatus.PENDING
        };
        console.log('Creating job with formatted data:', jobData);
        const job = await Job_1.default.create(jobData);
        console.log('Job created successfully:', job);
        res.status(201).json({
            success: true,
            data: { job }
        });
    }
    catch (error) {
        console.error('Error creating job:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to post job',
            details: error.errors || {}
        });
    }
};
exports.createJob = createJob;
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find({ status: enums_1.JobStatus.APPROVED })
            .select('-applications')
            .sort('-createdAt');
        res.status(200).json({
            success: true,
            data: { jobs }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.getAllJobs = getAllJobs;
const getEmployerJobs = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const jobs = await Job_1.default.find({ 'company.id': userId })
            .populate({
            path: 'applications',
            select: 'applicantName applicantEmail status resumeUrl createdAt'
        })
            .sort('-createdAt');
        res.status(200).json({
            success: true,
            data: { jobs }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.getEmployerJobs = getEmployerJobs;
const getAdminJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find()
            .select('-applications')
            .sort('-createdAt');
        res.status(200).json({
            success: true,
            data: { jobs }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.getAdminJobs = getAdminJobs;
const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const job = await Job_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        res.status(200).json({
            success: true,
            data: { job }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateJobStatus = updateJobStatus;
const applyForJob = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { name, email } = req.user;
        const job = await Job_1.default.findOne({ _id: id, status: enums_1.JobStatus.APPROVED });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or not available'
            });
        }
        const existingApplication = await JobApplication_1.default.findOne({
            jobId: id,
            applicantId: userId
        });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }
        const resumeFile = req.file;
        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: 'Resume is required'
            });
        }
        const resumeUrl = await (0, s3_1.uploadToS3)(resumeFile);
        const application = await JobApplication_1.default.create({
            jobId: id,
            applicantId: userId,
            applicantName: name,
            applicantEmail: email,
            resumeUrl,
            status: enums_1.ApplicationStatus.PENDING
        });
        job.applications.push(application._id);
        await job.save();
        res.status(201).json({
            success: true,
            data: { application }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.applyForJob = applyForJob;
const updateApplicationStatus = async (req, res) => {
    try {
        const { jobId, applicationId } = req.params;
        const { status } = req.body;
        const application = await JobApplication_1.default.findOneAndUpdate({ _id: applicationId, jobId }, { status }, { new: true });
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        res.status(200).json({
            success: true,
            data: { application }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=jobController.js.map