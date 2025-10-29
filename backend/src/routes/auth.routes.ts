import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { authRateLimit } from '../middleware/auth.middleware';
import { UserRole } from '../types/models';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['employer', 'jobseeker'])
    .withMessage('Invalid role')
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .optional()
    .trim()
    .isIn(['admin', 'employer', 'jobseeker'])
    .withMessage('Invalid role if provided')
];

// Password reset validation
const resetPasswordValidation = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token is required')
];

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Routes with validation
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/logout', logout);

// Debug route - temporary
router.get('/debug-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    
    res.json({
      message: 'Token debug info',
      decodedToken: decoded,
      tokenString: token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error decoding token', error });
  }
});

// Test endpoint to generate a token with a specific role
router.get('/test-token/:role', (req, res) => {
  try {
    const role = req.params.role.toLowerCase();
    if (!['employer', 'jobseeker', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be employer, jobseeker, or admin' });
    }
    
    const testUser = {
      _id: 'test-user-id-12345',
      role: role
    };
    
    // Import the JWT utils directly for token generation
    const { generateTokens } = require('../utils/jwt');
    const tokens = generateTokens(testUser);
    
    res.json({
      message: `Test token generated for ${role}`,
      tokens,
      decodedAccessToken: jwt.decode(tokens.accessToken)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating test token', error });
  }
});

// Test route to create an employer with proper role field
router.get('/create-test-employer', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { User } = require('../models/User');
    
    // Hash a password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpassword123', salt);
    
    // Delete existing test employer if it exists
    await User.findOneAndDelete({ email: 'test-employer@example.com' });
    
    // Create a new employer with explicit role field
    const employer = new User({
      name: 'Test Employer',
      email: 'test-employer@example.com',
      password: hashedPassword,
      companyName: 'Test Company',
      role: 'employer',  // Adding this explicitly
      emailVerified: true
    });
    
    await employer.save();
    
    // Generate tokens
    const { generateTokens } = require('../utils/jwt');
    const tokens = generateTokens(employer);
    
    res.json({
      message: 'Test employer created successfully',
      employer: {
        id: employer._id,
        name: employer.name,
        email: employer.email,
        companyName: employer.companyName,
        role: employer.role
      },
      tokens,
      loginInfo: {
        email: 'test-employer@example.com',
        password: 'testpassword123',
        role: 'employer'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test employer', error: error.message });
  }
});

// Testing password hashing
router.get('/test-password', async (req, res) => {
  try {
    const { User } = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    // Create a test password
    const testPassword = 'password123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    // Check if comparison works
    const directMatch = await bcrypt.compare(testPassword, hashedPassword);
    
    // Create a temporary user object with the hashed password
    const tempUser = {
      password: hashedPassword,
      comparePassword: async (candidatePassword) => {
        return await bcrypt.compare(candidatePassword, hashedPassword);
      }
    };
    
    // Test the comparePassword method
    const methodMatch = await tempUser.comparePassword(testPassword);
    
    res.json({
      message: 'Password hashing test',
      testPassword,
      hashedPassword,
      directMatch,
      methodMatch,
      isWorking: directMatch && methodMatch,
      bcryptjs_version: require('bcryptjs').version,
      salt_rounds: 10
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing password',
      error: error.message
    });
  }
});

// Test full auth flow
router.get('/test-auth-flow', async (req, res) => {
  try {
    const { User } = require('../models/User');
    const bcrypt = require('bcryptjs');
    const { generateTokens } = require('../utils/jwt');
    
    // Create a test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    // Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    
    // Create and save a test user
    const user = new User({
      name: 'Test User',
      email: testEmail,
      password: hashedPassword, // Use the pre-hashed password
      role: 'jobseeker',
      emailVerified: true
    });
    
    // Save without triggering the password hashing middleware
    user.isNew = true; // Make sure it's considered a new document
    const savedUser = await user.save();
    
    // Now try to login with the test user
    const loginUser = await User.findOne({ email: testEmail });
    
    // Verify the password manually
    const directMatch = await bcrypt.compare(testPassword, loginUser.password);
    
    // Try the model's comparePassword method
    const methodMatch = loginUser.comparePassword 
      ? await loginUser.comparePassword(testPassword)
      : 'Method not available';
    
    // Generate tokens
    const tokens = generateTokens(loginUser);
    
    res.json({
      message: 'Auth flow test',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role
      },
      passwordTests: {
        storedPassword: loginUser.password,
        directMatch,
        methodMatch,
        hasCompareMethod: !!loginUser.comparePassword
      },
      tokens,
      loginInfo: {
        email: testEmail,
        password: testPassword,
        role: 'jobseeker'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing auth flow',
      error: error.message
    });
  }
});

// Export the router
export default router; 