import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000'),

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/employee_management',
  mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/employee_management_test',

  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  redisPassword: process.env.REDIS_PASSWORD || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export default config;