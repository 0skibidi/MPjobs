import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';
import { UserRole } from '../types/models';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Rate limiting middleware
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      console.warn('No authorization header or incorrect format');
      return next(new AppError('Not authorized to access this route', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.length < 10) { // Basic validation for token format
      console.warn('Invalid token format in header');
      return next(new AppError('Invalid authentication token', 401));
    }

    try {
      // Log diagnostic info before verification
      const rawDecoded = jwt.decode(token);
      console.log('Token before verification:', {
        path: req.path,
        method: req.method,
        tokenInfo: rawDecoded ? {
          exp: rawDecoded.exp ? new Date(rawDecoded.exp * 1000).toISOString() : 'none',
          role: rawDecoded.role || 'none',
          type: rawDecoded.type || 'none'
        } : 'Could not decode'
      });
      
      // Verify token
      const decoded = await verifyToken(token);
      
      console.log('Token verified in protect middleware:', {
        userId: decoded.userId || decoded.id,
        role: decoded.role,
        type: decoded.type
      });
      
      // Handle potential field name mismatches in token
      // Token may have either userId or id field
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        console.error('No user ID found in token:', decoded);
        return next(new AppError('Invalid token format - missing user ID', 401));
      }
      
      // Check token type - more flexible now
      if (decoded.type && decoded.type !== 'access') {
        console.error('Token type mismatch:', decoded.type);
        return next(new AppError('Invalid access token type', 401));
      }

      // Add user info to request
      req.user = {
        userId: userId,
        role: decoded.role as UserRole
      };

      console.log('User set in request:', req.user);
      next();
    } catch (verifyError: any) {
      console.error('Token verification error:', {
        name: verifyError.name,
        message: verifyError.message,
        expiredAt: verifyError.expiredAt,
        path: req.path
      });
      
      // Return more specific error messages
      if (verifyError.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      } else if (verifyError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid authentication token. Please log in again.', 401));
      }
      
      return next(new AppError('Authentication failed. Please log in again.', 401));
    }
  } catch (error: any) {
    console.error('Auth middleware error:', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    next(new AppError('Authentication error. Please try again later.', 500));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    // Get role values as strings to enable flexible matching
    const roleValues = roles.map(role => role.toString().toLowerCase());
    const userRole = req.user.role.toString().toLowerCase();

    console.log('Authorization check:', {
      userRole,
      allowedRoles: roleValues
    });

    // Check if the user role (as string) is included in the allowed roles
    if (!roleValues.includes(userRole)) {
      return next(
        new AppError('Not authorized to access this route', 403)
      );
    }

    next();
  };
}; 