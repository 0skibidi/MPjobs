import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { IUser } from '../models/user.model';
import { Redis } from 'ioredis';

// Initialize Redis client for token blacklisting (optional)
let redis: Redis | null = null;
if (config.redisUrl) {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true
    });
    redis.on('error', (err) => {
      console.warn('Redis not available, using in-memory token storage');
      if (redis) {
        redis.disconnect();
        redis = null;
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Redis, using in-memory token storage');
    redis = null;
  }
}

interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export const generateTokens = (user: any) => {
  // Normalize role to ensure it matches UserRole enum values
  let normalizedRole = user.role;
  // If role is a string, normalize it to match enum values
  if (typeof user.role === 'string') {
    normalizedRole = user.role.toLowerCase();
  }
  
  console.log('JWT util - Using normalized role for token:', normalizedRole);
  
  const accessToken = jwt.sign(
    { userId: user._id || user.id, role: normalizedRole, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId: user._id || user.id, role: normalizedRole, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      // First decode the token without verification to get more info
      const decodedToken = jwt.decode(token);
      console.log('Token being verified:', { 
        decodedToken,
        currentTime: new Date(),
        tokenString: token.substring(0, 20) + '...',
      });
      
      // Actual verification
      jwt.verify(token, config.jwtSecret, { ignoreExpiration: false }, (err, decoded) => {
        if (err) {
          // If it's an expiration error, but the expiration date is actually in the future
          if (err.name === 'TokenExpiredError' && decodedToken && typeof decodedToken === 'object' && decodedToken.exp) {
            const expDate = new Date(decodedToken.exp * 1000);
            const now = new Date();
            console.error('Token expiration issue:', {
              tokenExpiration: expDate,
              currentTime: now,
              tokenIssuedAt: decodedToken.iat ? new Date(decodedToken.iat * 1000) : 'unknown',
              difference: (expDate.getTime() - now.getTime()) / (1000 * 60 * 60) + ' hours',
              error: err
            });
            
            // If token shows future expiration despite the error, accept it temporarily
            if (expDate > now) {
              console.warn('Token shows future expiration despite error - accepting temporarily.');
              resolve(decodedToken);
              return;
            }
          }
          
          console.error('Token verification failed:', err);
          reject(err);
        } else {
          console.log('Token verified successfully');
          resolve(decoded);
        }
      });
    } catch (error) {
      console.error('Unexpected error in token verification:', error);
      reject(error);
    }
  });
};

export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'reset' },
    config.jwtSecret,
    { expiresIn: config.passwordResetExpiry }
  );
};

export const generateEmailVerificationToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'email_verification' },
    config.jwtSecret,
    { expiresIn: config.emailVerificationExpiry }
  );
};

// For now, we'll use a simple in-memory store for blacklisted tokens
const blacklistedTokens = new Set<string>();

export const blacklistToken = async (token: string, expiresIn: number): Promise<void> => {
  blacklistedTokens.add(token);
  // Remove from blacklist after expiry
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, expiresIn * 1000);
}; 