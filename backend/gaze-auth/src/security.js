'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

function securityMiddleware() {
  const directives = {
    defaultSrc: ["'self'"],
    // Font Awesome's "kit" script loads its icon CSS and fonts from ka-f.fontawesome.com
    scriptSrc: ["'self'", 'https://accounts.google.com', 'https://kit.fontawesome.com'],
    // The app still uses inline onclick="..." attributes. This allows ONLY those attributes
    // (inline <script> blocks stay blocked). Remove it once the handlers are moved into JS files.
    scriptSrcAttr: ["'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com', 'https://fonts.googleapis.com', 'https://ka-f.fontawesome.com'],
    fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://ka-f.fontawesome.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://accounts.google.com', 'https://ka-f.fontawesome.com'],
    frameSrc: ["'self'", 'https://accounts.google.com'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  };
  if (config.isProd) directives.upgradeInsecureRequests = [];

  return [
    helmet({
      contentSecurityPolicy: { useDefaults: false, reportOnly: config.cspReportOnly, directives },
      // Google's sign-in popup needs this (helmet's default breaks it)
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginEmbedderPolicy: false,
    }),
    cors({
      origin(origin, cb) {
        // no Origin header = same-origin request, curl, etc.
        if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Gaze-Client'],
      maxAge: 600,
    }),
  ];
}

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message, code: 'RATE_LIMITED' },
    ...extra,
  });

const limiters = {
  // Every /api request, per IP
  api: make(60 * 1000, 300, 'Too many requests. Slow down.'),
  // Failed logins are what we count; successful ones don't use up the budget
  login: make(15 * 60 * 1000, 10, 'Too many login attempts. Try again in 15 minutes.', {
    skipSuccessfulRequests: true,
  }),
  signup: make(60 * 60 * 1000, 10, 'Too many signups from this network. Try again later.'),
  refresh: make(15 * 60 * 1000, 120, 'Too many session refreshes.'),
  sensitive: make(15 * 60 * 1000, 20, 'Too many attempts. Try again later.'),
  // "Forgot password" emails: keeps one person from flooding inboxes or burning the daily email quota
  forgot: make(60 * 60 * 1000, 5, 'Too many reset requests. Try again in an hour.'),
};

module.exports = { securityMiddleware, limiters };
