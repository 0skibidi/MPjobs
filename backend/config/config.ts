import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-board',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  environment: process.env.NODE_ENV || 'development',
  rateLimitWindowMs: 15 * 60 * 1000, 
  rateLimitMax: 100, 
  
  // redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // email configuration
  emailHost: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  emailPort: parseInt(process.env.EMAIL_PORT || '2525'),
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@jobboard.com',
  
  // qpplication configuration
  appName: process.env.APP_NAME || 'Job Board',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Auth configuration
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  passwordResetExpiry: '1h',
  emailVerificationExpiry: '24h'
}; 