import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { AppError } from '../middleware/errorHandler';
import { APIFeatures } from '../utils/queryFeatures';
import { AuthRequest } from '../middleware/auth.middleware';
import { JobStatus, UserRole } from '../types/models';
import { sendJobPostNotification } from '../utils/email';
import { JobApplication, ApplicationStatus } from '../models/JobApplication';

// Create a new job
export const createJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('CREATE JOB - Start');
    console.log('User in request:', req.user);
    
    // Extract job data from request
    let jobData = { ...req.body };
    
    // Get user ID if available
    let userId = null;
    if (req.user && req.user.userId) {
      userId = req.user.userId;
      console.log(`User ID from token: ${userId}`);
      
      // Find the user to get their company
      const user = await User.findById(userId);
      if (user) {
        console.log(`Found user: ${user.name}, role: ${user.role}`);
        
        if (user.role === UserRole.EMPLOYER) {
          // If the user is an employer, set their company as the job's company
          if (user.company) {
            console.log(`Using employer's company: ${user.company}`);
            jobData.company = user.company;
          } else {
            console.warn('Employer has no company associated with their account');
          }
          
          // Set the postedBy field to the employer's ID
          jobData.postedBy = userId;
        }
      } else {
        console.warn(`User not found with ID: ${userId}`);
      }
    }
    
    // Use a default company ID if none is provided or found
    if (!jobData.company) {
      console.warn('No company ID provided or found, using default');
      jobData.company = '65f1e4a18b53b70c3f356f9c'; // Use an existing company ID in your database
    }
    
    // Set postedBy if not already set
    if (!jobData.postedBy) {
      if (userId) {
        jobData.postedBy = userId;
      } else {
        console.warn('No postedBy ID set, using default');
        jobData.postedBy = '65f1e4a18b53b70c3f356f9c'; // Use an existing user ID
      }
    }
    
    // Make sure location is properly formatted
    if (!jobData.location || typeof jobData.location === 'string') {
      jobData.location = {
        city: typeof jobData.location === 'string' ? jobData.location : 'Unknown City',
        state: 'Unknown State',
        remote: false
      };
      console.log('Formatted location data');
    }
    
    // Set default values for required fields if missing
    if (!jobData.requirements) jobData.requirements = [];
    if (!jobData.skills) jobData.skills = [];
    if (!jobData.applicationDeadline) {
      // Set deadline to 30 days from now
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      jobData.applicationDeadline = deadline;
      console.log('Set default application deadline');
    }
    
    // Set initial status to PENDING for review
    jobData.status = JobStatus.PENDING;
    console.log('Setting initial job status to PENDING');

    console.log('Creating job with data:', {
      title: jobData.title,
      company: jobData.company,
      postedBy: jobData.postedBy,
      status: jobData.status
    });
    
    const job = await Job.create(jobData);
    console.log('Job created successfully:', job._id);

    // Populate the company data before sending the response
    const populatedJob = await Job.findById(job._id).populate('company', 'name description logo location industry website');

    // Notify the employer that the job has been posted
    try {
      // Get employer details
      if (jobData.postedBy) {
        const employer = await User.findById(jobData.postedBy);
        if (employer && employer.email) {
          await sendJobPostNotification(
            employer.email,
            employer.name || 'Employer',
            job.title,
            job._id.toString()
          );
          console.log('Job post notification sent to employer:', employer.email);
        }
      }
    } catch (notificationError) {
      // Don't fail the job creation if notification fails
      console.error('Failed to send job post notification:', notificationError);
    }

    res.status(201).json({
      status: 'success',
      data: { job: populatedJob }
    });
  } catch (error) {
    console.error('CREATE JOB - Error:', error);
    next(error);
  }
};

// Get all jobs with filtering, sorting, and pagination
export const getJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const features = new APIFeatures(Job.find({ status: JobStatus.APPROVED }), req.query)
      .filter()
      .sort()
      .limitFields()
      .search()
      .paginate();

    // Ensure company data is fully populated with all relevant fields
    const jobs = await features.query.populate('company', 'name description logo location industry website');
    const total = await Job.countDocuments({ status: JobStatus.APPROVED });

    res.status(200).json({
      status: 'success',
      results: jobs.length,
      total,
      data: { jobs }
    });
  } catch (error) {
    next(error);
  }
};

// Get job details
export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobId = req.params.id;

    // First, fetch the job details
    const job = await Job.findById(jobId)
      .populate('company', 'name description logo location industry website')
      .populate('applications', 'name email resume');

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Increment views count using findByIdAndUpdate to bypass validation
    await Job.findByIdAndUpdate(
      jobId, 
      { $inc: { viewsCount: 1 } }, 
      { new: true, runValidators: false }
    );

    // Return the job data with the updated view count
    res.status(200).json({
      status: 'success',
      data: { 
        job: {
          ...job.toObject(),
          viewsCount: job.viewsCount + 1 // Increment locally for immediate response
        }
      }
    });
  } catch (error) {
    console.error('Error in getJob controller:', error);
    next(error);
  }
};

// Update job
export const updateJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if user is the job owner
    const user = await User.findById(req.user?.userId);
    if (!user || (user.role !== UserRole.ADMIN && job.company.toString() !== user.company?.toString())) {
      return next(new AppError('Not authorized to update this job', 403));
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { job: updatedJob }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a job
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Find the job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
    }

    // Delete the job
    await Job.findByIdAndDelete(id);

    // Return success with no content
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Apply for job
export const applyForJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Log request information for debugging
    console.log('Job application attempt:', {
      jobId: req.params.id,
      userId: req.user?.userId,
      headers: req.headers['authorization'] ? 'Auth header present' : 'No auth header'
    });

    const job = await Job.findById(req.params.id);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if user ID is present
    if (!req.user?.userId) {
      return next(new AppError('Authentication required. Please log in again.', 401));
    }

    // Try to find the user
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User not found with ID: ${req.user.userId}`);
      return next(new AppError('User not found', 404));
    }
    
    // Check if already applied
    if (job.applications.includes(user._id)) {
      return next(new AppError('You have already applied for this job', 400));
    }

    // Check if application deadline has passed
    if (new Date(job.applicationDeadline) < new Date()) {
      return next(new AppError('Application deadline has passed', 400));
    }

    // Process resume file if it exists in the request
    let resumeUrl = user.resume || ''; // Use existing resume as fallback
    if (req.file) {
      // Here you would handle the file upload to storage (S3, etc.)
      resumeUrl = `/uploads/${req.file.filename}`;
      console.log('Resume file received:', req.file.filename);
    } else {
      console.log('No resume file in request, using profile resume:', resumeUrl);
    }

    // Get cover letter from request body if it exists
    const coverLetter = req.body.coverLetter || '';

    // Create a new JobApplication document
    const application = await JobApplication.create({
      job: job._id,
      applicant: user._id,
      resume: resumeUrl,
      coverLetter: coverLetter,
      status: ApplicationStatus.PENDING
    });

    console.log('Created new application:', application._id);

    // Add user to job applications
    job.applications.push(user._id);
    await job.save();
    console.log('Updated job with applicant');

    // Add job to user's applied jobs
    user.appliedJobs.push(job._id);
    await user.save();
    console.log('Updated user with applied job');

    res.status(200).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id
      }
    });
  } catch (error) {
    console.error('Error in job application:', error);
    next(error);
  }
};

// Get employer dashboard
export const getEmployerDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 EMPLOYER DASHBOARD - Start');
    console.log('👤 User in request:', req.user);
    
    if (!req.user?.userId) {
      console.error('❌ No user ID in request');
      return next(new AppError('Authentication required', 401));
    }
    
    // Find the employer user
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`❌ User not found with ID: ${req.user.userId}`);
      
      // Try looking in a different collection if you have separate employer records
      console.log('🔍 Trying alternative user lookup methods...');
      
      return next(new AppError('User not found', 404));
    }
    
    if (user.role !== UserRole.EMPLOYER) {
      console.error(`❌ User role is not employer: ${user.role}`);
      return next(new AppError('Only employers can access dashboard', 403));
    }
    
    console.log('👤 Found employer user:', {
      id: user._id,
      name: user.name || user.email || 'Unknown',
      company: user.company || 'No company ID in user record'
    });
    
    // Check if company field exists on the user
    if (!user.company) {
      console.error('❌ Employer has no company associated with their account');
      return res.status(200).json({
        status: 'success',
        message: 'No company associated with this employer',
        data: { jobs: [], stats: { totalJobs: 0, activeJobs: 0, pendingJobs: 0, totalApplications: 0 } }
      });
    }
    
    console.log('🏢 Looking for jobs with company ID:', user.company);
    
    // Find all jobs posted by this company, regardless of status
    const jobs = await Job.find({ company: user.company })
      .populate('company', 'name logo')
      .populate('applications', 'name email resume')
      .sort('-createdAt');
    
    console.log(`📋 Found ${jobs.length} jobs for company ID: ${user.company}`);
    
    // Log each job for debugging
    if (jobs.length > 0) {
      console.log('📝 Jobs found:');
      jobs.forEach((job, index) => {
        console.log(`Job ${index + 1}: ID=${job._id}, Title=${job.title}, Status=${job.status}`);
      });
    } else {
      console.log('❌ No jobs found for this company. Checking for recent jobs in the system:');
      const recentJobs = await Job.find().limit(5).select('_id title company status createdAt');
      console.log('Recent jobs in system:', recentJobs);
      
      // Also check if company exists
      const company = await Company.findById(user.company);
      if (company) {
        console.log(`✅ Company exists: ${company.name}`);
      } else {
        console.log(`❌ Company with ID ${user.company} does not exist in the database`);
      }
    }
    
    // Generate statistics with debug information
    const pendingJobs = jobs.filter(job => job.status === JobStatus.PENDING);
    const approvedJobs = jobs.filter(job => job.status === JobStatus.APPROVED);
    const stats = {
      totalJobs: jobs.length,
      pendingJobs: pendingJobs.length,
      activeJobs: approvedJobs.length,
      allStatuses: {
        PENDING: pendingJobs.length,
        APPROVED: approvedJobs.length,
        REJECTED: jobs.filter(job => job.status === JobStatus.REJECTED).length,
        FILLED: jobs.filter(job => job.status === JobStatus.FILLED).length,
        EXPIRED: jobs.filter(job => job.status === JobStatus.EXPIRED).length,
      },
      totalApplications: jobs.reduce((acc, job) => acc + job.applications.length, 0)
    };
    
    console.log('📊 Job statistics:', stats);
    console.log('🔍 EMPLOYER DASHBOARD - Success');

    res.status(200).json({
      status: 'success',
      data: { jobs, stats }
    });
  } catch (error) {
    console.error('❌ Error in getEmployerDashboard:', error);
    next(error);
  }
};

// Get employer applications
export const getEmployerApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Getting employer applications');
    
    if (!req.user?.userId) {
      console.error('No user ID in request');
      return next(new AppError('Authentication required', 401));
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User not found with ID: ${req.user.userId}`);
      return next(new AppError('User not found', 404));
    }
    
    if (user.role !== UserRole.EMPLOYER) {
      console.error(`User role is not employer: ${user.role}`);
      return next(new AppError('Only employers can access applications', 403));
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
    const jobs = await Job.find({ company: user.company })
      .populate({
        path: 'applications',
        select: 'name email resume'
      })
      .sort('-createdAt');
    
    console.log(`Found ${jobs.length} jobs for company: ${user.company}`);
    
    // Find all job applications for the company's jobs using the JobApplication model
    const jobIds = jobs.map(job => job._id);
    const applications = await JobApplication.find({ job: { $in: jobIds } })
      .populate('job', 'title company location')
      .populate('applicant', 'name email')
      .sort('-createdAt');
    
    console.log(`Found ${applications.length} applications across ${jobIds.length} jobs`);
    
    // Format applications for the response
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      job: {
        _id: app.job._id,
        title: app.job.title
      },
      applicant: {
        _id: app.applicant._id,
        name: app.applicant.name || 'Unknown',
        email: app.applicant.email || 'No email'
      },
      resume: app.resume,
      coverLetter: app.coverLetter,
      status: app.status,
      employerNotes: app.employerNotes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
    
    return res.status(200).json({
      status: 'success',
      data: { applications: formattedApplications }
    });
  } catch (error) {
    console.error('Error in getEmployerApplications:', error);
    return next(error);
  }
};

// Get jobs for admin with all statuses
export const getAdminJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('GET ADMIN JOBS - Start');
    
    // Extract status filter from query if present
    const statusFilter = req.query.status;
    console.log('Status filter:', statusFilter);
    
    // Create query based on status filter
    let query = Job.find();
    if (statusFilter) {
      query = Job.find({ status: statusFilter });
    }
    
    // For admin, we don't filter by status by default so they can see all jobs
    const features = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .search()
      .paginate();
    
    // Always populate company data to avoid ObjectId display issues
    // Ensure full population of company data with all relevant fields
    const jobs = await features.query
      .populate({
        path: 'company',
        select: 'name description logo location industry website',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'postedBy',
        select: 'name email',
        options: { strictPopulate: false }
      });
    
    console.log(`Found ${jobs.length} jobs`);
    
    // Manually format the response
    const formattedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      
      // Handle company field more safely
      if (typeof jobObj.company === 'object' && jobObj.company) {
        // Company is already an object, keep it as is
        // But ensure it has a name
        if (!jobObj.company.name) {
          jobObj.company.name = 'Company name not provided';
        }
      } else if (jobObj.company) {
        // Company is just an ID, provide a default object with the ID
        console.log(`Job ${jobObj._id} has company ID but failed to populate:`, jobObj.company);
        jobObj.company = {
          _id: jobObj.company,
          name: 'Company info unavailable'
        };
      } else {
        // Handle null or undefined company
        console.log(`Job ${jobObj._id} has no company reference`);
        jobObj.company = {
          _id: '000000000000000000000000',
          name: 'Unknown Company'
        };
      }
      
      // Handle postedBy field safely
      if (!jobObj.postedBy) {
        jobObj.postedBy = {
          name: 'Unknown',
          email: 'unknown@example.com'
        };
      }
      
      return jobObj;
    });
    
    const total = await Job.countDocuments();
    
    console.log('GET ADMIN JOBS - Success');
    
    res.status(200).json({
      status: 'success',
      results: formattedJobs.length,
      total,
      data: { jobs: formattedJobs }
    });
  } catch (error) {
    console.error('GET ADMIN JOBS - Error:', error);
    next(error);
  }
};

// Update job status (for admin)
export const updateJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('UPDATE JOB STATUS - Start');
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log(`Updating job ${id} to status: ${status}`);

    // Add validation for required parameters
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

    // Find the job first to get its previous state
    const existingJob = await Job.findById(id);
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

    // Find the job and update its status without population
    try {
      const job = await Job.findByIdAndUpdate(
        id,
        { 
          status,
          adminNotes // Add admin notes if provided
        },
        { new: true, runValidators: true }
      ).populate('company', 'name');

      if (!job) {
        console.log('Job not found after update');
        return res.status(404).json({
          status: 'fail',
          message: 'Job not found'
        });
      }
      
      console.log(`Job status updated from ${existingJob.status} to ${job.status}`);
      
      // If job was approved, try to find the employer to notify them
      if (status === JobStatus.APPROVED && existingJob.status !== JobStatus.APPROVED) {
        try {
          console.log('Job was approved, finding employer to notify...');
          
          // Find the employer who posted this job
          if (existingJob.postedBy) {
            const employer = await User.findById(existingJob.postedBy);
            if (employer && employer.email) {
              console.log(`Found employer: ${employer.name}, sending notification...`);
              // You would add notification logic here
              // For example: await sendJobApprovedNotification(employer.email, job.title);
              console.log(`Notification would be sent to ${employer.email} about approved job: ${job.title}`);
            } else {
              console.log('Employer not found or no email available');
            }
          } else {
            console.log('No postedBy field on job, cannot notify employer');
          }
        } catch (notifyError) {
          console.error('Error notifying employer:', notifyError);
          // Don't fail the status update if notification fails
        }
      }
      
      // Manually format the response
      const jobObj = job.toObject();
      
      // Add safe company data
      if (typeof jobObj.company === 'object' && jobObj.company) {
        // Keep it as is
        console.log('Company info present:', jobObj.company);
      } else {
        // Convert to simpler representation
        console.log('Company info not populated, using ID:', jobObj.company);
        jobObj.company = {
          _id: jobObj.company,
          name: 'Company info unavailable'
        };
      }
      
      // Add safe postedBy data
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Database operation failed',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('UPDATE JOB STATUS - Unhandled error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
      error: error.message
    });
  }
};

// Get applications for a job seeker
export const getUserApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Getting user applications for:', req.user?.userId);
    
    // Check if user ID is present
    if (!req.user?.userId) {
      return next(new AppError('Authentication required. Please log in again.', 401));
    }

    // Find the user
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User not found with ID: ${req.user.userId}`);
      return next(new AppError('User not found', 404));
    }

    // Check if user is a job seeker
    if (user.role !== UserRole.JOBSEEKER) {
      return next(new AppError('Only job seekers can view their applications', 403));
    }

    // Find applications using the JobApplication model
    // This is more reliable than using the user.appliedJobs relationship
    const applications = await JobApplication.find({ applicant: user._id })
      .populate({
        path: 'job',
        select: 'title company description location salaryRange jobType status applicationDeadline',
        populate: {
          path: 'company',
          select: 'name logo'
        }
      })
      .sort('-createdAt');
    
    console.log(`Found ${applications.length} applications for user: ${user._id}`);

    // If no applications found in the JobApplication model,
    // fall back to checking the User.appliedJobs array as a backup 
    // (for applications submitted before this fix)
    if (applications.length === 0 && user.appliedJobs && user.appliedJobs.length > 0) {
      console.log(`No applications found in JobApplication model, falling back to user.appliedJobs (${user.appliedJobs.length} jobs)`);
      
      // Populate the applied jobs with detailed information
      const populatedUser = await User.findById(user._id)
        .populate({
          path: 'appliedJobs',
          select: 'title company description location salaryRange jobType status applicationDeadline',
          populate: {
            path: 'company',
            select: 'name logo'
          }
        });

      if (!populatedUser) {
        return next(new AppError('Failed to retrieve user data', 500));
      }

      // Get job IDs from the user's appliedJobs array
      const jobIds = populatedUser.appliedJobs.map(job => job._id);

      // Find jobs that include the user in their applications array
      const jobs = await Job.find({
        _id: { $in: jobIds },
        applications: { $elemMatch: { $eq: user._id } }
      });

      // Create application objects from the legacy data
      const legacyApplications = populatedUser.appliedJobs.map(job => {
        const fullJob = jobs.find(j => j._id.toString() === job._id.toString());
        
        // Default application status is PENDING
        let status = 'PENDING';
        
        if (fullJob && fullJob.status === JobStatus.FILLED) {
          const wasAccepted = fullJob.applications.length === 1 && 
                            fullJob.applications[0].toString() === user._id.toString();
          status = wasAccepted ? 'ACCEPTED' : 'REJECTED';
        }

        // Create a legacy application object
        return {
          _id: fullJob ? fullJob._id : job._id,
          job: job,
          status: status,
          createdAt: fullJob ? fullJob.createdAt : new Date(),
          updatedAt: fullJob ? fullJob.updatedAt : new Date()
        };
      });

      // Send response with legacy applications
      return res.status(200).json({
        status: 'success',
        results: legacyApplications.length,
        data: {
          applications: legacyApplications
        }
      });
    }

    // Format applications for response
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      job: app.job,
      status: app.status,
      resume: app.resume,
      coverLetter: app.coverLetter,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));

    // Send response
    res.status(200).json({
      status: 'success',
      results: formattedApplications.length,
      data: {
        applications: formattedApplications
      }
    });
  } catch (error) {
    console.error('Error in getUserApplications:', error);
    next(error);
  }
};

// Get a specific job application
export const getUserApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Getting application details for:', req.params.id);
    
    // Check if user ID is present
    if (!req.user?.userId) {
      return next(new AppError('Authentication required. Please log in again.', 401));
    }

    // Find the user
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User not found with ID: ${req.user.userId}`);
      return next(new AppError('User not found', 404));
    }

    // Get the job ID from the request parameters
    const jobId = req.params.id;
    if (!jobId) {
      return next(new AppError('Job ID is required', 400));
    }

    // Find the job
    const job = await Job.findById(jobId).populate('company', 'name logo location industry website');
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if the user has applied for this job
    if (!user.appliedJobs.includes(job._id) && !job.applications.includes(user._id)) {
      return next(new AppError('You have not applied for this job', 403));
    }

    // Determine application status
    let status = 'PENDING';
    if (job.status === JobStatus.FILLED) {
      // If job is filled and this user is the only applicant, they were accepted
      // Otherwise, they were rejected
      const wasAccepted = job.applications.length === 1 && 
                         job.applications[0].toString() === user._id.toString();
      status = wasAccepted ? 'ACCEPTED' : 'REJECTED';
    }

    // Construct application object
    const application = {
      _id: job._id,
      job: job,
      status: status,
      resume: user.resume || '',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };

    // Send response
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error in getUserApplication:', error);
    next(error);
  }
};

// Withdraw a job application
export const withdrawApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Withdrawing application for job:', req.params.id);
    
    // Check if user ID is present
    if (!req.user?.userId) {
      return next(new AppError('Authentication required. Please log in again.', 401));
    }

    // Find the user
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User not found with ID: ${req.user.userId}`);
      return next(new AppError('User not found', 404));
    }

    // Get the job ID from the request parameters
    const jobId = req.params.id;
    if (!jobId) {
      return next(new AppError('Job ID is required', 400));
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    // Check if the user has applied for this job
    if (!user.appliedJobs.includes(job._id) && !job.applications.includes(user._id)) {
      return next(new AppError('You have not applied for this job', 403));
    }

    // Check if the job is already filled
    if (job.status === JobStatus.FILLED) {
      return next(new AppError('Cannot withdraw application for a filled job', 400));
    }

    // Remove the job from the user's appliedJobs array
    user.appliedJobs = user.appliedJobs.filter(
      appliedJobId => appliedJobId.toString() !== job._id.toString()
    );
    await user.save();

    // Remove the user from the job's applications array
    job.applications = job.applications.filter(
      applicantId => applicantId.toString() !== user._id.toString()
    );
    await job.save();

    // Send response
    res.status(200).json({
      status: 'success',
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Error in withdrawApplication:', error);
    next(error);
  }
};

// Track application email click
export const trackApplicationClick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobId = req.params.id;
    
    // Find the job and increment the click count
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { applicationClickCount: 1 } },
      { new: true }
    );
    
    if (!job) {
      return next(new AppError('Job not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Application click tracked'
    });
  } catch (error) {
    console.error('Error tracking application click:', error);
    next(error);
  }
}; 