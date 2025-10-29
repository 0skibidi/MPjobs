"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployerDashboard = exports.applyForJob = exports.deleteJob = exports.updateJob = exports.getJob = exports.getJobs = exports.createJob = void 0;
const Job_1 = require("../models/Job");
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const errorHandler_1 = require("../middleware/errorHandler");
const queryFeatures_1 = require("../utils/queryFeatures");
const models_1 = require("../types/models");
const createJob = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const user = await User_1.User.findById(userId);
        if (!user || user.role !== models_1.UserRole.EMPLOYER) {
            return next(new errorHandler_1.AppError('Only employers can create jobs', 403));
        }
        const job = await Job_1.Job.create({
            ...req.body,
            company: user.company,
            status: models_1.JobStatus.PENDING
        });
        await Company_1.Company.findByIdAndUpdate(user.company, {
            $push: { postedJobs: job._id }
        });
        res.status(201).json({
            status: 'success',
            data: { job }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
const getJobs = async (req, res, next) => {
    try {
        const features = new queryFeatures_1.APIFeatures(Job_1.Job.find({ status: models_1.JobStatus.APPROVED }), req.query)
            .filter()
            .sort()
            .limitFields()
            .search()
            .paginate();
        const jobs = await features.query.populate('company', 'name logo');
        const total = await Job_1.Job.countDocuments({ status: models_1.JobStatus.APPROVED });
        res.status(200).json({
            status: 'success',
            results: jobs.length,
            total,
            data: { jobs }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
const getJob = async (req, res, next) => {
    try {
        const job = await Job_1.Job.findById(req.params.id)
            .populate('company', 'name description logo location industry website')
            .populate('applications', 'name email resume');
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        job.viewsCount += 1;
        await job.save();
        res.status(200).json({
            status: 'success',
            data: { job }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJob = getJob;
const updateJob = async (req, res, next) => {
    var _a, _b;
    try {
        const job = await Job_1.Job.findById(req.params.id);
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        const user = await User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user || (user.role !== models_1.UserRole.ADMIN && job.company.toString() !== ((_b = user.company) === null || _b === void 0 ? void 0 : _b.toString()))) {
            return next(new errorHandler_1.AppError('Not authorized to update this job', 403));
        }
        const updatedJob = await Job_1.Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({
            status: 'success',
            data: { job: updatedJob }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res, next) => {
    var _a, _b;
    try {
        const job = await Job_1.Job.findById(req.params.id);
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        const user = await User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user || (user.role !== models_1.UserRole.ADMIN && job.company.toString() !== ((_b = user.company) === null || _b === void 0 ? void 0 : _b.toString()))) {
            return next(new errorHandler_1.AppError('Not authorized to delete this job', 403));
        }
        await job.remove();
        await Company_1.Company.findByIdAndUpdate(job.company, {
            $pull: { postedJobs: job._id }
        });
        res.status(204).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
const applyForJob = async (req, res, next) => {
    var _a;
    try {
        const job = await Job_1.Job.findById(req.params.id);
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        const user = await User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user || user.role !== models_1.UserRole.JOBSEEKER) {
            return next(new errorHandler_1.AppError('Only job seekers can apply for jobs', 403));
        }
        if (job.applications.includes(user._id)) {
            return next(new errorHandler_1.AppError('You have already applied for this job', 400));
        }
        if (new Date(job.applicationDeadline) < new Date()) {
            return next(new errorHandler_1.AppError('Application deadline has passed', 400));
        }
        job.applications.push(user._id);
        await job.save();
        user.appliedJobs.push(job._id);
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Application submitted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.applyForJob = applyForJob;
const getEmployerDashboard = async (req, res, next) => {
    var _a;
    try {
        const user = await User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user || user.role !== models_1.UserRole.EMPLOYER) {
            return next(new errorHandler_1.AppError('Only employers can access dashboard', 403));
        }
        const jobs = await Job_1.Job.find({ company: user.company })
            .populate('applications', 'name email resume')
            .sort('-createdAt');
        const stats = {
            totalJobs: jobs.length,
            activeJobs: jobs.filter(job => job.status === models_1.JobStatus.APPROVED).length,
            pendingJobs: jobs.filter(job => job.status === models_1.JobStatus.PENDING).length,
            totalApplications: jobs.reduce((acc, job) => acc + job.applications.length, 0)
        };
        res.status(200).json({
            status: 'success',
            data: { jobs, stats }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmployerDashboard = getEmployerDashboard;
//# sourceMappingURL=job.controller.js.map