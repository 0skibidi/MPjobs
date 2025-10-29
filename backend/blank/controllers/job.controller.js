"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawApplication = exports.getUserApplication = exports.getUserApplications = exports.updateJobStatus = exports.getAdminJobs = exports.getEmployerApplications = exports.getEmployerDashboard = exports.applyForJob = exports.deleteJob = exports.updateJob = exports.getJob = exports.getJobs = exports.createJob = void 0;
const Job_1 = require("../models/Job");
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const errorHandler_1 = require("../middleware/errorHandler");
const queryFeatures_1 = require("../utils/queryFeatures");
const models_1 = require("../types/models");
const email_1 = require("../utils/email");
const createJob = async (req, res, next) => {
    try {
        console.log('CREATE JOB - Start');
        console.log('User in request:', req.user);
        let jobData = { ...req.body };
        let userId = null;
        if (req.user && req.user.userId) {
            userId = req.user.userId;
            console.log(`User ID from token: ${userId}`);
            const user = await User_1.User.findById(userId);
            if (user) {
                console.log(`Found user: ${user.name}, role: ${user.role}`);
                if (user.role === models_1.UserRole.EMPLOYER) {
                    if (user.company) {
                        console.log(`Using employer's company: ${user.company}`);
                        jobData.company = user.company;
                    }
                    else {
                        console.warn('Employer has no company associated with their account');
                    }
                    jobData.postedBy = userId;
                }
            }
            else {
                console.warn(`User not found with ID: ${userId}`);
            }
        }
        if (!jobData.company) {
            console.warn('No company ID provided or found, using default');
            jobData.company = '65f1e4a18b53b70c3f356f9c';
        }
        if (!jobData.postedBy) {
            if (userId) {
                jobData.postedBy = userId;
            }
            else {
                console.warn('No postedBy ID set, using default');
                jobData.postedBy = '65f1e4a18b53b70c3f356f9c';
            }
        }
        if (!jobData.location || typeof jobData.location === 'string') {
            jobData.location = {
                city: typeof jobData.location === 'string' ? jobData.location : 'Unknown City',
                state: 'Unknown State',
                remote: false
            };
            console.log('Formatted location data');
        }
        if (!jobData.requirements)
            jobData.requirements = [];
        if (!jobData.skills)
            jobData.skills = [];
        if (!jobData.applicationDeadline) {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 30);
            jobData.applicationDeadline = deadline;
            console.log('Set default application deadline');
        }
        jobData.status = models_1.JobStatus.PENDING;
        console.log('Setting initial job status to PENDING');
        console.log('Creating job with data:', {
            title: jobData.title,
            company: jobData.company,
            postedBy: jobData.postedBy,
            status: jobData.status
        });
        const job = await Job_1.Job.create(jobData);
        console.log('Job created successfully:', job._id);
        const populatedJob = await Job_1.Job.findById(job._id).populate('company', 'name description logo location industry website');
        try {
            if (jobData.postedBy) {
                const employer = await User_1.User.findById(jobData.postedBy);
                if (employer && employer.email) {
                    await (0, email_1.sendJobPostNotification)(employer.email, employer.name || 'Employer', job.title, job._id.toString());
                    console.log('Job post notification sent to employer:', employer.email);
                }
            }
        }
        catch (notificationError) {
            console.error('Failed to send job post notification:', notificationError);
        }
        res.status(201).json({
            status: 'success',
            data: { job: populatedJob }
        });
    }
    catch (error) {
        console.error('CREATE JOB - Error:', error);
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
        const jobs = await features.query.populate('company', 'name description logo location industry website');
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
        const jobId = req.params.id;
        const job = await Job_1.Job.findById(jobId)
            .populate('company', 'name description logo location industry website')
            .populate('applications', 'name email resume');
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        await Job_1.Job.findByIdAndUpdate(jobId, { $inc: { viewsCount: 1 } }, { new: true, runValidators: false });
        res.status(200).json({
            status: 'success',
            data: {
                job: {
                    ...job.toObject(),
                    viewsCount: job.viewsCount + 1
                }
            }
        });
    }
    catch (error) {
        console.error('Error in getJob controller:', error);
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
    try {
        const { id } = req.params;
        const job = await Job_1.Job.findById(id);
        if (!job) {
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found'
            });
        }
        await Job_1.Job.findByIdAndDelete(id);
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
    var _a, _b;
    try {
        console.log('Job application attempt:', {
            jobId: req.params.id,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            headers: req.headers['authorization'] ? 'Auth header present' : 'No auth header'
        });
        
        const job = await Job_1.Job.findById(req.params.id);
        if (!job) {
            console.error(`Job not found with ID: ${req.params.id}`);
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        
        console.log(`Found job: ${job.title}`);
        
        if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId)) {
            console.error('No user ID in request');
            return next(new errorHandler_1.AppError('Authentication required. Please log in again.', 401));
        }
        
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.user.userId}`);
            console.log('Attempting to create application with user ID only');
            
            // Check if we've already added this user ID to the job applications
            if (!job.applications.includes(req.user.userId)) {
                console.log(`Adding user ID ${req.user.userId} to job applications`);
                job.applications.push(req.user.userId);
                await job.save();
                console.log('Job updated successfully');
            } else {
                console.log(`User ID ${req.user.userId} already in job applications`);
            }
            
            res.status(200).json({
                status: 'success',
                message: 'Application submitted successfully',
                note: 'User profile information could not be updated'
            });
            return;
        }
        
        console.log(`Found user: ${user.name || user.email || user._id}`);
        
        // Check if already applied
        if (job.applications.includes(user._id)) {
            console.log(`User ${user._id} has already applied for job ${job._id}`);
            return next(new errorHandler_1.AppError('You have already applied for this job', 400));
        }
        
        // Check application deadline
        if (new Date(job.applicationDeadline) < new Date()) {
            console.log(`Application deadline has passed for job ${job._id}`);
            return next(new errorHandler_1.AppError('Application deadline has passed', 400));
        }
        
        console.log(`Adding user ${user._id} to job ${job._id} applications`);
        
        // Add user to job applications
        job.applications.push(user._id);
        await job.save();
        console.log('Job updated with new applicant');
        
        // Add job to user's applied jobs
        if (!user.appliedJobs.includes(job._id)) {
            user.appliedJobs.push(job._id);
            await user.save();
            console.log('User updated with new applied job');
        } else {
            console.log('Job already in user applied jobs');
        }
        
        console.log('Application submitted successfully');
        
        // Notify the employer about the new application (commented out for now)
        /*
        try {
            const company = await Company_1.Company.findById(job.company);
            if (company) {
                const employerIds = company.owners || [];
                for (const employerId of employerIds) {
                    const employer = await User_1.User.findById(employerId);
                    if (employer && employer.email) {
                        await (0, email_1.sendApplicationNotification)(employer.email, {
                            applicantName: user.name || 'A candidate',
                            jobTitle: job.title,
                            companyName: company.name
                        });
                    }
                }
            }
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
        }
        */
        
        res.status(200).json({
            status: 'success',
            message: 'Application submitted successfully'
        });
    }
    catch (error) {
        console.error('Error in job application:', error);
        next(error);
    }
};
exports.applyForJob = applyForJob;
const getEmployerDashboard = async (req, res, next) => {
    var _a;
    try {
        console.log('🔍 EMPLOYER DASHBOARD - Start');
        console.log('👤 User in request:', req.user);
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            console.error('❌ No user ID in request');
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`❌ User not found with ID: ${req.user.userId}`);
            console.log('🔍 Trying alternative user lookup methods...');
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        if (user.role !== models_1.UserRole.EMPLOYER) {
            console.error(`❌ User role is not employer: ${user.role}`);
            return next(new errorHandler_1.AppError('Only employers can access dashboard', 403));
        }
        console.log('👤 Found employer user:', {
            id: user._id,
            name: user.name || user.email || 'Unknown',
            company: user.company || 'No company ID in user record'
        });
        if (!user.company) {
            console.error('❌ Employer has no company associated with their account');
            return res.status(200).json({
                status: 'success',
                message: 'No company associated with this employer',
                data: { jobs: [], stats: { totalJobs: 0, activeJobs: 0, pendingJobs: 0, totalApplications: 0 } }
            });
        }
        console.log('🏢 Looking for jobs with company ID:', user.company);
        const jobs = await Job_1.Job.find({ company: user.company })
            .populate('company', 'name logo')
            .populate('applications', 'name email resume')
            .sort('-createdAt');
        console.log(`📋 Found ${jobs.length} jobs for company ID: ${user.company}`);
        if (jobs.length > 0) {
            console.log('📝 Jobs found:');
            jobs.forEach((job, index) => {
                console.log(`Job ${index + 1}: ID=${job._id}, Title=${job.title}, Status=${job.status}`);
            });
        }
        else {
            console.log('❌ No jobs found for this company. Checking for recent jobs in the system:');
            const recentJobs = await Job_1.Job.find().limit(5).select('_id title company status createdAt');
            console.log('Recent jobs in system:', recentJobs);
            const company = await Company_1.Company.findById(user.company);
            if (company) {
                console.log(`✅ Company exists: ${company.name}`);
            }
            else {
                console.log(`❌ Company with ID ${user.company} does not exist in the database`);
            }
        }
        const pendingJobs = jobs.filter(job => job.status === models_1.JobStatus.PENDING);
        const approvedJobs = jobs.filter(job => job.status === models_1.JobStatus.APPROVED);
        const stats = {
            totalJobs: jobs.length,
            pendingJobs: pendingJobs.length,
            activeJobs: approvedJobs.length,
            allStatuses: {
                PENDING: pendingJobs.length,
                APPROVED: approvedJobs.length,
                REJECTED: jobs.filter(job => job.status === models_1.JobStatus.REJECTED).length,
                FILLED: jobs.filter(job => job.status === models_1.JobStatus.FILLED).length,
                EXPIRED: jobs.filter(job => job.status === models_1.JobStatus.EXPIRED).length,
            },
            totalApplications: jobs.reduce((acc, job) => acc + job.applications.length, 0)
        };
        console.log('📊 Job statistics:', stats);
        console.log('🔍 EMPLOYER DASHBOARD - Success');
        res.status(200).json({
            status: 'success',
            data: { jobs, stats }
        });
    }
    catch (error) {
        console.error('❌ Error in getEmployerDashboard:', error);
        next(error);
    }
};
exports.getEmployerDashboard = getEmployerDashboard;
const getEmployerApplications = async (req, res, next) => {
    try {
        console.log('Getting employer applications');
        
        if (!req.user?.userId) {
            console.error('No user ID in request');
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.user.userId}`);
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        
        if (user.role !== models_1.UserRole.EMPLOYER) {
            console.error(`User role is not employer: ${user.role}`);
            return next(new errorHandler_1.AppError('Only employers can access applications', 403));
        }
        
        if (!user.company) {
            console.error('Employer has no company associated with their account');
            return res.status(200).json({
                status: 'success',
                message: 'No company associated with this employer',
                data: { applications: [] }
            });
        }
        
        // Find all jobs posted by this company
        const jobs = await Job_1.Job.find({ company: user.company })
            .populate({
                path: 'applications',
                select: 'name email resume'
            })
            .sort('-createdAt');
        
        // Extract all applications from all jobs
        const applications = [];
        for (const job of jobs) {
            if (job.applications && job.applications.length > 0) {
                for (const applicant of job.applications) {
                    applications.push({
                        _id: applicant._id || 'unknown',
                        job: {
                            _id: job._id,
                            title: job.title
                        },
                        applicant: {
                            _id: applicant._id || 'unknown',
                            name: applicant.name || 'Unknown Applicant',
                            email: applicant.email || 'No email provided'
                        },
                        status: applicant.status || 'PENDING',
                        resume: applicant.resume || '',
                        appliedAt: job.updatedAt || new Date()
                    });
                }
            }
        }
        
        console.log(`Found ${applications.length} applications across ${jobs.length} jobs`);
        
        return res.status(200).json({
            status: 'success',
            data: { applications }
        });
    }
    catch (error) {
        console.error('Error in getEmployerApplications:', error);
        return next(error);
    }
};
exports.getEmployerApplications = getEmployerApplications;
const getAdminJobs = async (req, res, next) => {
    try {
        console.log('GET ADMIN JOBS - Start');
        const features = new queryFeatures_1.APIFeatures(Job_1.Job.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .search()
            .paginate();
        const jobs = await features.query.populate('company', 'name description logo location industry website');
        console.log(`Found ${jobs.length} jobs`);
        const formattedJobs = jobs.map(job => {
            const jobObj = job.toObject();
            if (typeof jobObj.company === 'object' && jobObj.company) {
            }
            else if (jobObj.company) {
                jobObj.company = {
                    _id: jobObj.company,
                    name: 'Company info unavailable'
                };
            }
            else {
                jobObj.company = {
                    _id: '000000000000000000000000',
                    name: 'Unknown Company'
                };
            }
            if (!jobObj.postedBy) {
                jobObj.postedBy = {
                    name: 'Unknown',
                    email: 'unknown@example.com'
                };
            }
            return jobObj;
        });
        const total = await Job_1.Job.countDocuments();
        console.log('GET ADMIN JOBS - Success');
        res.status(200).json({
            status: 'success',
            results: formattedJobs.length,
            total,
            data: { jobs: formattedJobs }
        });
    }
    catch (error) {
        console.error('GET ADMIN JOBS - Error:', error);
        next(error);
    }
};
exports.getAdminJobs = getAdminJobs;
const updateJobStatus = async (req, res, next) => {
    try {
        console.log('UPDATE JOB STATUS - Start');
        console.log('Request body:', req.body);
        console.log('Request params:', req.params);
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        console.log(`Updating job ${id} to status: ${status}`);
        if (!id) {
            console.error('Job ID is missing');
            return res.status(400).json({
                status: 'fail',
                message: 'Job ID is required'
            });
        }
        if (!status) {
            console.error('Status is missing in request body');
            return res.status(400).json({
                status: 'fail',
                message: 'Status is required in request body'
            });
        }
        const existingJob = await Job_1.Job.findById(id);
        if (!existingJob) {
            console.log('Job not found');
            return res.status(404).json({
                status: 'fail',
                message: 'Job not found'
            });
        }
        console.log(`Previous job status: ${existingJob.status}, new status: ${status}`);
        console.log('Job company ID:', existingJob.company);
        console.log('Job posted by user ID:', existingJob.postedBy);
        try {
            const job = await Job_1.Job.findByIdAndUpdate(id, {
                status,
                adminNotes
            }, { new: true, runValidators: true }).populate('company', 'name');
            if (!job) {
                console.log('Job not found after update');
                return res.status(404).json({
                    status: 'fail',
                    message: 'Job not found'
                });
            }
            console.log(`Job status updated from ${existingJob.status} to ${job.status}`);
            if (status === models_1.JobStatus.APPROVED && existingJob.status !== models_1.JobStatus.APPROVED) {
                try {
                    console.log('Job was approved, finding employer to notify...');
                    if (existingJob.postedBy) {
                        const employer = await User_1.User.findById(existingJob.postedBy);
                        if (employer && employer.email) {
                            console.log(`Found employer: ${employer.name}, sending notification...`);
                            console.log(`Notification would be sent to ${employer.email} about approved job: ${job.title}`);
                        }
                        else {
                            console.log('Employer not found or no email available');
                        }
                    }
                    else {
                        console.log('No postedBy field on job, cannot notify employer');
                    }
                }
                catch (notifyError) {
                    console.error('Error notifying employer:', notifyError);
                }
            }
            const jobObj = job.toObject();
            if (typeof jobObj.company === 'object' && jobObj.company) {
                console.log('Company info present:', jobObj.company);
            }
            else {
                console.log('Company info not populated, using ID:', jobObj.company);
                jobObj.company = {
                    _id: jobObj.company,
                    name: 'Company info unavailable'
                };
            }
            if (!jobObj.postedBy) {
                jobObj.postedBy = {
                    name: 'Unknown',
                    email: 'unknown@example.com'
                };
            }
            console.log('UPDATE JOB STATUS - Success');
            return res.status(200).json({
                status: 'success',
                data: { job: jobObj }
            });
        }
        catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                status: 'error',
                message: 'Database operation failed',
                error: dbError.message
            });
        }
    }
    catch (error) {
        console.error('UPDATE JOB STATUS - Unhandled error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An unexpected error occurred',
            error: error.message
        });
    }
};
exports.updateJobStatus = updateJobStatus;
const getUserApplications = async (req, res, next) => {
    var _a, _b;
    try {
        console.log('Getting user applications for:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId)) {
            return next(new errorHandler_1.AppError('Authentication required. Please log in again.', 401));
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.user.userId}`);
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        if (user.role !== models_1.UserRole.JOBSEEKER) {
            return next(new errorHandler_1.AppError('Only job seekers can view their applications', 403));
        }
        const populatedUser = await User_1.User.findById(user._id)
            .populate({
            path: 'appliedJobs',
            select: 'title company description location salaryRange jobType status applicationDeadline',
            populate: {
                path: 'company',
                select: 'name logo'
            }
        });
        if (!populatedUser) {
            return next(new errorHandler_1.AppError('Failed to retrieve user data', 500));
        }
        const jobIds = populatedUser.appliedJobs.map(job => job._id);
        const jobs = await Job_1.Job.find({
            _id: { $in: jobIds },
            applications: { $elemMatch: { $eq: user._id } }
        });
        const applications = populatedUser.appliedJobs.map(job => {
            const fullJob = jobs.find(j => j._id.toString() === job._id.toString());
            let status = 'PENDING';
            if (fullJob && fullJob.status === models_1.JobStatus.FILLED) {
                const wasAccepted = fullJob.applications.length === 1 &&
                    fullJob.applications[0].toString() === user._id.toString();
                status = wasAccepted ? 'ACCEPTED' : 'REJECTED';
            }
            return {
                _id: fullJob ? fullJob._id : job._id,
                job: job,
                status: status,
                createdAt: fullJob ? fullJob.createdAt : new Date(),
                updatedAt: fullJob ? fullJob.updatedAt : new Date()
            };
        });
        res.status(200).json({
            status: 'success',
            results: applications.length,
            data: {
                applications
            }
        });
    }
    catch (error) {
        console.error('Error in getUserApplications:', error);
        next(error);
    }
};
exports.getUserApplications = getUserApplications;
const getUserApplication = async (req, res, next) => {
    var _a;
    try {
        console.log('Getting application details for:', req.params.id);
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return next(new errorHandler_1.AppError('Authentication required. Please log in again.', 401));
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.user.userId}`);
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        const jobId = req.params.id;
        if (!jobId) {
            return next(new errorHandler_1.AppError('Job ID is required', 400));
        }
        const job = await Job_1.Job.findById(jobId).populate('company', 'name logo location industry website');
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        if (!user.appliedJobs.includes(job._id) && !job.applications.includes(user._id)) {
            return next(new errorHandler_1.AppError('You have not applied for this job', 403));
        }
        let status = 'PENDING';
        if (job.status === models_1.JobStatus.FILLED) {
            const wasAccepted = job.applications.length === 1 &&
                job.applications[0].toString() === user._id.toString();
            status = wasAccepted ? 'ACCEPTED' : 'REJECTED';
        }
        const application = {
            _id: job._id,
            job: job,
            status: status,
            resume: user.resume || '',
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        };
        res.status(200).json({
            status: 'success',
            data: {
                application
            }
        });
    }
    catch (error) {
        console.error('Error in getUserApplication:', error);
        next(error);
    }
};
exports.getUserApplication = getUserApplication;
const withdrawApplication = async (req, res, next) => {
    var _a;
    try {
        console.log('Withdrawing application for job:', req.params.id);
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
            return next(new errorHandler_1.AppError('Authentication required. Please log in again.', 401));
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.error(`User not found with ID: ${req.user.userId}`);
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        const jobId = req.params.id;
        if (!jobId) {
            return next(new errorHandler_1.AppError('Job ID is required', 400));
        }
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            return next(new errorHandler_1.AppError('Job not found', 404));
        }
        if (!user.appliedJobs.includes(job._id) && !job.applications.includes(user._id)) {
            return next(new errorHandler_1.AppError('You have not applied for this job', 403));
        }
        if (job.status === models_1.JobStatus.FILLED) {
            return next(new errorHandler_1.AppError('Cannot withdraw application for a filled job', 400));
        }
        user.appliedJobs = user.appliedJobs.filter(appliedJobId => appliedJobId.toString() !== job._id.toString());
        await user.save();
        job.applications = job.applications.filter(applicantId => applicantId.toString() !== user._id.toString());
        await job.save();
        res.status(200).json({
            status: 'success',
            message: 'Application withdrawn successfully'
        });
    }
    catch (error) {
        console.error('Error in withdrawApplication:', error);
        next(error);
    }
};
exports.withdrawApplication = withdrawApplication;
//# sourceMappingURL=job.controller.js.map