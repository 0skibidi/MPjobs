import express from 'express';
import {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
  getEmployerDashboard,
  getAdminJobs,
  updateJobStatus,
  getEmployerApplications,
  getUserApplications,
  getUserApplication,
  withdrawApplication,
  trackApplicationClick
} from '../controllers/job.controller';
import { protect, authorize, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../types/models';
import { User } from '../models/User';

const router = express.Router();

// Public routes that don't have path parameters
router.get('/', getJobs);
router.post('/', createJob);

// Test route for debugging
router.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.status(200).json({ 
    status: 'success', 
    message: 'API is working properly' 
  });
});

// Token debug route
router.get('/debug-token', protect, (req: AuthRequest, res) => {
  console.log('Debug token route accessed');
  console.log('User in request:', req.user);
  
  res.status(200).json({
    status: 'success',
    user: req.user,
    message: 'Token debug information'
  });
});

// Check auth endpoint
router.get('/check-auth', protect, async (req: AuthRequest, res) => {
  try {
    console.log('Check auth endpoint accessed');
    // Get user from database to verify they exist
    if (!req.user?.userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'Not authenticated'
      });
    }
    
    // Try to find user in database
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Return user details
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
  } catch (error) {
    console.error('Error in check-auth:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// TEMPORARY TEST ROUTE - PUBLIC JOB CREATION
// router.post('/public-create', createJob);

// Admin routes
router.get('/admin/jobs', protect, authorize([UserRole.ADMIN]), getAdminJobs);
router.patch('/admin/jobs/:id/status', protect, authorize([UserRole.ADMIN]), updateJobStatus);

// Protected routes base middleware
router.use(protect);

// Job seeker routes
router.get('/user/applications', authorize([UserRole.JOBSEEKER]), getUserApplications);
router.get('/user/applications/:id', authorize([UserRole.JOBSEEKER]), getUserApplication);
router.delete('/user/applications/:id', authorize([UserRole.JOBSEEKER]), withdrawApplication);

// Employer routes - IMPORTANT: define these BEFORE any /:id routes to prevent conflicts
router.get('/employer/dashboard', authorize([UserRole.EMPLOYER]), getEmployerDashboard);
router.get('/employer/applications', authorize([UserRole.EMPLOYER]), getEmployerApplications);

// Job routes with parameters - these should come AFTER all specific routes
router.route('/:id/apply').post(authorize([UserRole.JOBSEEKER]), applyForJob);
router.route('/:id/track-click').post(trackApplicationClick); // Public route for tracking clicks
router.route('/:id')
  .get(getJob)
  .patch(authorize([UserRole.ADMIN, UserRole.EMPLOYER]), updateJob)
  .delete(authorize([UserRole.ADMIN, UserRole.EMPLOYER]), deleteJob);

export default router; 