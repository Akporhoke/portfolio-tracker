'use strict';

// Put this file in:  backend/gaze-auth/src/portfolio-guard.js
//
// Use in server.js:
//   const portfolioGuard = require('./gaze-auth/src/portfolio-guard');
//   app.use('/api/portfolio', portfolioGuard, portfolioRoutes);
//
// What it enforces for every /api/portfolio/... request:
//   1. You must be logged in (valid access token).
//   2. The :userId in the URL must be YOUR id. Anyone else's id -> 403.
// Public market-data routes (stock price history) are let through.

const { requireAuth } = require('./middleware');

const PUBLIC_PATHS = [/^\/stocks\/history\/[^/]+\/?$/];
const isPublic = (path) => PUBLIC_PATHS.some((rx) => rx.test(path));

function requireLogin(req, res, next) {
  if (isPublic(req.path)) return next();
  return requireAuth(req, res, next);
}

function requireOwnPortfolio(req, res, next) {
  if (isPublic(req.path)) return next();

  let urlUserId = '';
  try {
    urlUserId = decodeURIComponent(req.path.split('/')[1] || '');
  } catch (_) {
    return res.status(400).json({ error: 'Bad request', code: 'BAD_PATH' });
  }

  if (!req.auth || urlUserId !== req.auth.userId) {
    return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  }
  return next();
}

module.exports = [requireLogin, requireOwnPortfolio];