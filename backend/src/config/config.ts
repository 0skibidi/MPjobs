import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from multiple possible locations
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Helper function for environment variables with logging
const getEnv = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  if (!value) {
    console.log(`Environment variable ${key} not found, using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};

// Build MongoDB connection string with support for auth
const buildMongoUri = (): string => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  const host = getEnv('MONGO_HOST', 'localhost');
  const port = getEnv('MONGO_PORT', '27017');
  const db = getEnv('MONGO_DB', 'fbla_job_board');
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  
  if (user && pass) {
    return `mongodb://${user}:${pass}@${host}:${port}/${db}`;
  }
  return `mongodb://${host}:${port}/${db}`;
};

export const config = {
  // Server configuration
  port: getEnv('PORT', '5008'),
  mongoUri: buildMongoUri(),
  jwtSecret: getEnv('JWT_SECRET', 'fallback-secret-key-for-development-only'),
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // API rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
  
  // Redis configuration (optional)
  redisUrl: process.env.REDIS_URL || null,
  
  // Auth configuration
  accessTokenExpiry: getEnv('JWT_ACCESS_EXPIRY', '24h'),
  refreshTokenExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
  passwordResetExpiry: getEnv('PASSWORD_RESET_EXPIRY', '1h'),
  emailVerificationExpiry: getEnv('EMAIL_VERIFICATION_EXPIRY', '24h'),
  
  // CORS configuration
  corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:5174'),
  
  // Email configuration
  emailService: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  
  // Application configuration
  appName: process.env.APP_NAME || 'FBLA Job Board',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',
};

// Log configuration summary on startup (but don't expose secrets)
console.log('Server configuration loaded:', {
  port: config.port,
  mongoDbHost: config.mongoUri.split('@').pop()?.split('/')[0] || 'unknown',
  mongoDbName: config.mongoUri.split('/').pop() || 'unknown',
  environment: config.environment,
  hasRedis: !!config.redisUrl,
  corsOrigin: config.corsOrigin
}); 