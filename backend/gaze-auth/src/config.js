'use strict';

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

const isProd = process.env.NODE_ENV === 'production';

const jwtSecret = required('JWT_ACCESS_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be set in production');
}

module.exports = {
  isProd,
  usersUri: required('MONGODB_USERS_URI'),
  jwtSecret,
  allowedOrigins,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  cspReportOnly: (process.env.CSP_MODE || 'report-only') !== 'enforce',

  accessTtlSeconds: 15 * 60,              // access JWT lifetime
  refreshTtlMs: 30 * 24 * 60 * 60 * 1000, // refresh session lifetime (sliding)
  refreshGraceMs: 10 * 1000,              // allow parallel tabs to refresh at once
  maxSessionsPerUser: 10,

  cookieName: 'gz_rt',
  cookiePath: '/api/auth',                // refresh cookie is only sent to auth routes

  bcryptCost: 12,
  maxFailedLogins: 5,
  lockMs: 15 * 60 * 1000,
};
