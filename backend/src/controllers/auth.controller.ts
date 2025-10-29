import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Admin } from '../models/admin.model';
import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';
import {
  verifyToken,
  blacklistToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateTokens as jwtGenerateTokens
} from '../utils/jwt';
import {
  sendVerificationEmail,
  sendPasswordResetEmail
} from '../utils/email';
import { config } from '../config/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import util from 'util';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Debug logging with timestamps and log to file (for 500 errors)
const debugLogger = {
  // Log directory creation
  logDir: path.join(process.cwd(), 'logs'),
  
  // Ensure log directory exists
  ensureLogDirExists: () => {
    if (!fs.existsSync(debugLogger.logDir)) {
      try {
        fs.mkdirSync(debugLogger.logDir, { recursive: true });
        console.log(`Created logs directory at ${debugLogger.logDir}`);
      } catch (err) {
        console.error('Failed to create logs directory:', err);
      }
    }
  },
  
  // Log to file with timestamp
  logToFile: (message: string, data: any, label: string = 'DEBUG') => {
    debugLogger.ensureLogDirExists();
    
    const timestamp = new Date().toISOString();
    const logFile = path.join(debugLogger.logDir, `auth-${new Date().toISOString().split('T')[0]}.log`);
    
    const logData = typeof data === 'string' ? data : util.inspect(data, { depth: null, colors: false });
    const logEntry = `[${timestamp}] [${label}] ${message}\n${logData}\n\n`;
    
    try {
      fs.appendFileSync(logFile, logEntry);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  },
  
  // Log to console and file
  log: (message: string, data: any, label: string = 'DEBUG') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${label}] ${message}`);
    console.log(data);
    
    debugLogger.logToFile(message, data, label);
  },
  
  // Log error specially
  error: (message: string, error: any) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    };
    
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
    console.error(errorData);
    
    debugLogger.logToFile(message, errorData, 'ERROR');
  }
};

// Helper function to introduce a delay for testing (simulates network latency)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Use the consistent token generation from jwt utils
const generateTokens = (user: any) => {
  try {
    console.log('Auth controller delegating token generation to JWT utils');
    return jwtGenerateTokens(user);
  } catch (error) {
    console.error('Token generation failed in auth controller:', error);
    // Return empty tokens instead of throwing
    return { 
      accessToken: '', 
      refreshToken: '' 
    };
  }
};

export const register = async (req: Request, res: Response) => {
  // Add request debugging
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  debugLogger.log(`Registration request received [ID: ${requestId}]`, {
    body: { ...req.body, password: '***REDACTED***' },
    headers: req.headers,
    ip: req.ip,
    method: req.method,
    path: req.path,
  });
  
  try {
    console.log('Registration request received:', req.body);
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      const missingFields = {
        name: !name,
        email: !email,
        password: !password,
        role: !role
      };
      
      debugLogger.log(`Validation failed - missing fields [ID: ${requestId}]`, missingFields, 'VALIDATION');
      
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: {
          name: !name ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          role: !role ? 'Role is required' : undefined
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      debugLogger.log(`Validation failed - invalid email format [ID: ${requestId}]`, { email }, 'VALIDATION');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['employer', 'jobseeker', 'admin'];
    if (!validRoles.includes(role)) {
      debugLogger.log(`Validation failed - invalid role [ID: ${requestId}]`, { role, validRoles }, 'VALIDATION');
      return res.status(400).json({ 
        message: 'Invalid role specified',
        validRoles
      });
    }

    // Log database state before operation
    debugLogger.log(`Database connection state [ID: ${requestId}]`, {
      readyState: mongoose.connection.readyState,
      db: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host
    }, 'DB');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    debugLogger.log(`Password hashed successfully [ID: ${requestId}]`, { success: true }, 'SECURITY');
    
    // Ensure mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      debugLogger.log(`MongoDB connection not ready [ID: ${requestId}]`, {
        readyState: mongoose.connection.readyState,
        attempting: 'reconnect'
      }, 'DB_ERROR');
      
      console.error('MongoDB connection not ready, attempting to reconnect');
      // Try to reconnect
      try {
        await mongoose.connect(config.mongoUri);
        debugLogger.log(`MongoDB reconnection successful [ID: ${requestId}]`, {
          readyState: mongoose.connection.readyState,
        }, 'DB');
      } catch (connError) {
        console.error('Failed to reconnect to MongoDB:', connError);
        debugLogger.error(`MongoDB reconnection failed [ID: ${requestId}]`, connError);
        return res.status(500).json({ message: 'Database connection error, please try again later' });
      }
    }
    
    // Determine which collection to check and save to based on role
    let collection;
    try {
      if (role === 'employer') {
        collection = mongoose.connection.collection('employers');
      } else if (role === 'jobseeker') {
        collection = mongoose.connection.collection('jobseekers');
      } else if (role === 'admin') {
        collection = mongoose.connection.collection('admins');
      } else {
        debugLogger.log(`Invalid role specified [ID: ${requestId}]`, { role }, 'VALIDATION');
        return res.status(400).json({ message: 'Invalid role specified' });
      }
      
      debugLogger.log(`Collection selected for role [ID: ${requestId}]`, {
        role,
        collectionName: collection.collectionName,
        exists: !!collection
      }, 'DB');
    } catch (collectionError: any) {
      console.error('Error accessing collection:', collectionError);
      debugLogger.error(`Error accessing collection [ID: ${requestId}]`, collectionError);
      return res.status(500).json({ 
        message: 'Database error while accessing collections',
        details: collectionError.message
      });
    }
    
    try {
      // Check if user already exists in the appropriate collection
      debugLogger.log(`Checking for existing user [ID: ${requestId}]`, { email }, 'DB');
      const existingUser = await collection.findOne({ email });
      
      if (existingUser) {
        debugLogger.log(`Email already registered [ID: ${requestId}]`, { email }, 'AUTH');
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      debugLogger.log(`Email check passed [ID: ${requestId}]`, { emailAvailable: true }, 'AUTH');
    } catch (findError: any) {
      console.error('Error checking for existing user:', findError);
      debugLogger.error(`Error checking for existing user [ID: ${requestId}]`, findError);
      return res.status(500).json({ 
        message: 'Error checking if email already exists',
        details: findError.message
      });
    }

    // Create new user document for the appropriate collection
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add company name if provided and user is employer
      ...(role === 'employer' && req.body.companyName && { companyName: req.body.companyName })
    };

    console.log(`Attempting to save user with role ${role}:`, { name, email });
    debugLogger.log(`Attempting to save user [ID: ${requestId}]`, {
      name,
      email,
      role,
      hasCompanyName: !!req.body.companyName
    }, 'DB');
    
    let userId;
    try {
      const result = await collection.insertOne(userData);
      userId = result.insertedId;
      console.log(`User saved successfully:`, userId);
      debugLogger.log(`User saved successfully [ID: ${requestId}]`, {
        userId: userId.toString(),
        role
      }, 'DB');
    } catch (insertError: any) {
      console.error('Error inserting new user:', insertError);
      debugLogger.error(`Error inserting new user [ID: ${requestId}]`, insertError);
      
      // Handle duplicate key error specifically
      if (insertError.code === 11000) {
        return res.status(400).json({ 
          message: 'Email already exists',
          details: 'This email is already registered in our system'
        });
      }
      return res.status(500).json({ 
        message: 'Error creating user account',
        details: insertError.message
      });
    }

    // Generate tokens
    try {
      debugLogger.log(`Preparing token generation [ID: ${requestId}]`, {
        userId: userId.toString(),
        role
      }, 'AUTH');
      
      const userForToken = {
        _id: userId,
        name,
        email,
        role
      };
      
      debugLogger.log(`Calling generateTokens [ID: ${requestId}]`, {
        attempting: true
      }, 'AUTH');
      
      const { accessToken, refreshToken } = generateTokens(userForToken);
      
      // Log whether tokens were actually generated
      const tokensGenerated = !!accessToken && !!refreshToken;
      
      debugLogger.log(`Tokens generation attempt completed [ID: ${requestId}]`, {
        success: tokensGenerated,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      }, 'AUTH');

      // If this is an employer, automatically create a company profile
      if (role === 'employer') {
        try {
          // Check if user already has a company profile
          const companyCollection = mongoose.connection.collection('companies');
          debugLogger.log(`Checking for existing company [ID: ${requestId}]`, {
            userId: userId.toString()
          }, 'DB');
          
          const existingCompany = await companyCollection.findOne({ userId: userId });
          
          if (!existingCompany) {
            debugLogger.log(`Creating default company profile [ID: ${requestId}]`, {
              userId: userId.toString()
            }, 'DB');
            
            // Create a default company profile
            const companyData = {
              name: req.body.companyName || `${name}'s Company`,
              description: "Company description not provided yet.",
              userId: userId,
              location: {
                street: "",
                city: "Not specified",
                state: "Not specified",
                country: "USA"
              },
              industry: "Not specified",
              website: "https://example.com",
              verified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            const companyResult = await companyCollection.insertOne(companyData);
            console.log('Default company profile created with ID:', companyResult.insertedId);
            debugLogger.log(`Company profile created [ID: ${requestId}]`, {
              companyId: companyResult.insertedId.toString()
            }, 'DB');
            
            // Update the employer record with the company reference
            await collection.updateOne(
              { _id: userId },
              { $set: { company: companyResult.insertedId } }
            );
            debugLogger.log(`Employer record updated with company [ID: ${requestId}]`, {
              userId: userId.toString(),
              companyId: companyResult.insertedId.toString()
            }, 'DB');
          }
        } catch (companyError) {
          console.error('Error creating default company profile:', companyError);
          debugLogger.error(`Error creating company profile [ID: ${requestId}]`, companyError);
          // We don't want to fail registration if company creation fails
          // Just log it and proceed
        }
      }
      
      // Log success
      debugLogger.log(`Registration successful [ID: ${requestId}]`, {
        userId: userId.toString(),
        role,
        status: 201,
        tokensGenerated
      }, 'SUCCESS');

      // Return meaningful response even if tokens failed
      if (!tokensGenerated) {
        return res.status(201).json({
          message: `User registered successfully as ${role}, but token generation failed. Please try logging in.`,
          user: {
            id: userId,
            name,
            email,
            role
          },
          tokenError: 'Failed to generate authentication tokens'
        });
      }

      return res.status(201).json({
        message: `User registered successfully as ${role}`,
        user: {
          id: userId,
          name,
          email,
          role
        },
        accessToken,
        refreshToken,
      });
    } catch (tokenError: any) {
      console.error('Error generating authentication tokens:', tokenError);
      debugLogger.error(`Error generating tokens [ID: ${requestId}]`, tokenError);
      
      // We've already created the user, so just return a meaningful error
      return res.status(201).json({
        message: `User registered successfully but token generation failed. Please try logging in.`,
        user: {
          id: userId,
          name,
          email,
          role
        },
        error: 'Token generation failed'
      });
    }
  } catch (error: any) {
    console.error('Registration error details:', error);
    debugLogger.error(`Unhandled registration error [ID: ${requestId}]`, error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = 'Error registering user';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Validation error';
    } else if (error.code === 11000) {
      statusCode = 400;
      errorMessage = 'Email already exists';
    } else if (error.name === 'MongoServerError') {
      errorMessage = 'Database error';
    }
    
    // Return a detailed error response
    res.status(statusCode).json({ 
      message: errorMessage, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
    // Start timing the login process
    const startTime = Date.now();

    // If no role is specified, try to find the user in any collection
    if (!role) {
      console.log('No role specified, searching all collections');
      // Try jobseekers first
      let user = await mongoose.connection.collection('jobseekers').findOne({ email });
      let userRole = 'jobseeker';
      
      // If not found, try employers
      if (!user) {
        user = await mongoose.connection.collection('employers').findOne({ email });
        userRole = 'employer';
      }
      
      // If still not found, try admins
      if (!user) {
        user = await mongoose.connection.collection('admins').findOne({ email });
        userRole = 'admin';
      }
      
      // If user is found in any collection, proceed with login
      if (user) {
        console.log(`User found in ${userRole} collection:`, user._id);
        
        // Verify password
        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
          console.log('Password does not match for user:', user._id);
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate tokens
        const userForToken = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: userRole
        };
        
        const { accessToken, refreshToken } = generateTokens(userForToken);
        
        // If this is an employer, check if they have a company profile
        if (userRole === 'employer') {
          try {
            // Check if user already has a company profile
            const companyCollection = mongoose.connection.collection('companies');
            const existingCompany = await companyCollection.findOne({ userId: user._id });
            
            if (!existingCompany) {
              console.log('Creating default company profile for existing employer');
              // Create a default company profile
              const companyData = {
                name: `${user.name}'s Company`,
                description: "Company description not provided yet.",
                userId: user._id,
                location: {
                  street: "",
                  city: "Not specified",
                  state: "Not specified",
                  country: "USA"
                },
                industry: "Not specified",
                website: "https://example.com",
                verified: false,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              const companyResult = await companyCollection.insertOne(companyData);
              console.log('Default company profile created with ID:', companyResult.insertedId);
              
              // Update the employer record with the company reference
              await mongoose.connection.collection('employers').updateOne(
                { _id: user._id },
                { $set: { company: companyResult.insertedId } }
              );
              console.log('Employer record updated with company reference');
            }
          } catch (companyError) {
            console.error('Error creating/checking company profile:', companyError);
            // We don't want to fail login if company creation fails
            // Just log it and proceed
          }
        }
        
        // Log timing information
        const endTime = Date.now();
        console.log(`Login completed in ${endTime - startTime}ms`);

        return res.json({
          message: 'Login successful',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: userRole
          },
          accessToken,
          refreshToken,
        });
      }
    }

    // If role is specified or no user was found without a role, proceed with role-based search
    let collection;
    if (role === 'employer') {
      collection = mongoose.connection.collection('employers');
    } else if (role === 'jobseeker') {
      collection = mongoose.connection.collection('jobseekers');
    } else if (role === 'admin') {
      collection = mongoose.connection.collection('admins');
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Find user in the appropriate collection
    const user = await collection.findOne({ email });

    if (!user) {
      console.log('User not found for:', { email, role });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    console.log('Comparing passwords...');
    console.log('Password from request:', password);
    console.log('Stored hashed password:', user.password);
    
    // Use bcrypt to compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const userForToken = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role
    };

    const { accessToken, refreshToken } = generateTokens(userForToken);
    
    // Log timing information
    const endTime = Date.now();
    console.log(`Login completed in ${endTime - startTime}ms`);

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = await verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Determine which collection to check based on role in token
    let collection;
    if (decoded.role === 'employer') {
      collection = mongoose.connection.collection('employers');
    } else if (decoded.role === 'jobseeker') {
      collection = mongoose.connection.collection('jobseekers');
    } else if (decoded.role === 'admin') {
      collection = mongoose.connection.collection('admins');
    } else {
      return next(new AppError('Invalid role in token', 400));
    }

    // Find user by ID
    const user = await collection.findOne({ _id: new mongoose.Types.ObjectId(decoded.userId) });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Blacklist old refresh token
    await blacklistToken(refreshToken, 60 * 60 * 24 * 7); // 7 days

    res.status(200).json({
      status: 'success',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No user found with this email', 404));
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user._id);

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = await verifyToken(token);
    if (decoded.type !== 'reset') {
      return next(new AppError('Invalid reset token', 401));
    }

    // Find and update user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.password = password;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = await verifyToken(token);
    if (decoded.type !== 'email_verification') {
      return next(new AppError('Invalid verification token', 401));
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { emailVerified: true },
      { new: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Blacklist the refresh token
    await blacklistToken(refreshToken);
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};