import express from 'express';
import {
  getEmployerCompanyProfile,
  updateEmployerCompanyProfile
} from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/models';

const router = express.Router();

// Protected routes - all user routes require authentication
router.use(protect);

// Employer company profile routes
router.get('/employer/company', authorize(UserRole.EMPLOYER), getEmployerCompanyProfile);
router.patch('/employer/company', authorize(UserRole.EMPLOYER), updateEmployerCompanyProfile);

export default router; 