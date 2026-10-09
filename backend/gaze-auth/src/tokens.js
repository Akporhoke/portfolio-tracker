'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('./config');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Opaque random refresh token (not a JWT). Only its hash is stored in the DB.
const newRefreshToken = () => crypto.randomBytes(48).toString('base64url');

function signAccess(user, sessionId) {
  return jwt.sign({ role: user.role, sid: String(sessionId) }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(user._id),
    issuer: 'gaze',
    expiresIn: config.accessTtlSeconds,
  });
}

function verifyAccess(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'gaze' });
}

module.exports = { sha256, newRefreshToken, signAccess, verifyAccess };
