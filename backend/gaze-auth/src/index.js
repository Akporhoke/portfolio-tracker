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
  app.set('trust proxy', config.trustProxyHops); // proxies in front of the app (TRUST_PROXY_HOPS); needed for real client IPs
  app.disable('x-powered-by');
  app.use(securityMiddleware());
  app.use(cookieParser());
  app.use(apiPrefix, limiters.api);

  // TEMPORARY: lets you check which IP the server sees. Compare "ip" with https://api.ipify.org
  // and adjust TRUST_PROXY_HOPS until they match. Turn off again with ENABLE_IP_DEBUG=false.
  if (config.ipDebug) {
    console.warn('[auth] ENABLE_IP_DEBUG is on: GET ' + apiPrefix + '/_ip is public. Turn it off after checking.');
    app.get(`${apiPrefix}/_ip`, (req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json({
        ip: req.ip,
        ips: req.ips,
        xForwardedFor: req.headers['x-forwarded-for'] || null,
        hops: config.trustProxyHops
      });
    });
  }
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
