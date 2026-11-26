import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isProduction = nodeEnv === 'production';

const parseOrigins = (raw) => {
  if (!raw) return isProduction ? [] : ['http://localhost:5173'];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv,
  isTest,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret:
    process.env.JWT_SECRET ||
    (isTest ? 'test-only-jwt-secret-key-at-least-32-chars' : ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'auth_token',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'csrf_token',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 15,
  apiRateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX) || 500,
  enableAdminBootstrap: process.env.ENABLE_ADMIN_BOOTSTRAP === 'true',
  adminSeedName: process.env.ADMIN_SEED_NAME || 'System Administrator',
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || '',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || '',
};

export function validateEnv() {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  if (
    env.isProduction &&
    (env.jwtSecret.length < 32 || env.jwtSecret.includes('replace_with'))
  ) {
    throw new Error(
      'JWT_SECRET must be a strong secret of at least 32 characters in production.'
    );
  }
  if (!env.isTest && !env.mongodbUri) {
    throw new Error('MONGODB_URI environment variable is required.');
  }
  if (env.isProduction && env.corsOrigins.length === 0) {
    console.warn('[Config Warning] CORS_ORIGIN is not set in production.');
  }
}
