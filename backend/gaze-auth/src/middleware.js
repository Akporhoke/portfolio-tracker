'use strict';

const config = require('./config');
const { verifyAccess } = require('./tokens');
const User = require('./models/User');

// Express 4 doesn't catch rejected promises - this does.
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
  }
  try {
    const p = verifyAccess(token);
    req.auth = { userId: p.sub, role: p.role, sessionId: p.sid };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }
}

// Role is re-checked in the DB, never trusted from the token alone.
function requireRole(role) {
  return [
    requireAuth,
    asyncH(async (req, res, next) => {
      const user = await User.findById(req.auth.userId).select('role');
      if (!user || user.role !== role) {
        return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
      }
      return next();
    }),
  ];
}

// Use on any route that unlocks a paid feature:  app.get('/api/x', requirePlan('pro'), handler)
function requirePlan(plan) {
  return [
    requireAuth,
    asyncH(async (req, res, next) => {
      const user = await User.findById(req.auth.userId);
      if (!user) return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
      if (plan === 'pro' && user.activePlan() !== 'pro') {
        return res.status(402).json({ error: 'This feature needs a Pro plan', code: 'UPGRADE_REQUIRED' });
      }
      req.user = user;
      return next();
    }),
  ];
}

// CSRF defence for the cookie-based routes (refresh / logout):
// the request must come from an allowed origin AND carry our custom header.
function requireSameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed', code: 'BAD_ORIGIN' });
  }
  if (req.headers['x-gaze-client'] !== 'web') {
    return res.status(403).json({ error: 'Missing client header', code: 'BAD_CLIENT' });
  }
  return next();
}

module.exports = { asyncH, requireAuth, requireRole, requirePlan, requireSameOrigin };
