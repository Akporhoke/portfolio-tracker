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

const emailApiKey = process.env.EMAIL_API_KEY || '';
const emailProvider = (process.env.EMAIL_PROVIDER || (emailApiKey ? 'brevo' : 'console')).toLowerCase();
if (!['brevo', 'console'].includes(emailProvider)) {
  throw new Error('EMAIL_PROVIDER must be "brevo" or "console"');
}

// How many proxies sit in front of the app (Render: Cloudflare + Render's own). Tune with TRUST_PROXY_HOPS.
const hopsRaw = Number(process.env.TRUST_PROXY_HOPS ?? 1);
const trustProxyHops = Number.isInteger(hopsRaw) && hopsRaw >= 0 && hopsRaw <= 5 ? hopsRaw : 1;

module.exports = {
  isProd,
  usersUri: required('MONGODB_USERS_URI'),
  jwtSecret,
  allowedOrigins,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  cspReportOnly: (process.env.CSP_MODE || 'report-only') !== 'enforce',

  trustProxyHops,
  ipDebug: process.env.ENABLE_IP_DEBUG === 'true',  // temporary /api/_ip route to find the right hop count

  // Links in emails are built from this, NEVER from the request's Host header
  appUrl: (process.env.APP_URL || allowedOrigins[0] || 'http://localhost:5000').replace(/\/$/, ''),
  emailProvider,
  emailApiKey,
  emailFrom: process.env.EMAIL_FROM || '',
  verifyTtlMs: 24 * 60 * 60 * 1000,
  resetTtlMs: 30 * 60 * 1000,
  emailCooldownMs: 60 * 1000,   // at most one email of each kind per account per minute
  emailMaxPerHour: 4,           // and at most 4 per hour

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
