'use strict';

const cookieParser = require('cookie-parser');
const config = require('./config');
const { securityMiddleware, limiters } = require('./security');
const authRouter = require('./routes/auth');
const { requireAuth, requireRole, requirePlan } = require('./middleware');
const { usersConn } = require('./db');
const User = require('./models/User');
const Session = require('./models/Session');

/**
 * Call once, EARLY in your server file (before your other routes):
 *   const { mountAuth } = require('./gaze-auth/src');
 *   mountAuth(app);
 */
function mountAuth(app, { apiPrefix = '/api' } = {}) {
  app.set('trust proxy', 1); // Render sits behind a proxy; needed for real client IPs
  app.disable('x-powered-by');
  app.use(securityMiddleware());
  app.use(cookieParser());
  app.use(apiPrefix, limiters.api);
  app.use(`${apiPrefix}/auth`, authRouter);
}

module.exports = {
  mountAuth,
  requireAuth,
  requireRole,
  requirePlan,
  limiters,
  usersConn,
  models: { User, Session },
  config,
};
