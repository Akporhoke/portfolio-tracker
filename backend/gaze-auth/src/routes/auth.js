'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const config = require('../config');
const User = require('../models/User');
const Session = require('../models/Session');
const { sha256, newRefreshToken, signAccess } = require('../tokens');
const { schemas, badRequest } = require('../validate');
const { limiters } = require('../security');
const { asyncH, requireAuth, requireSameOrigin } = require('../middleware');

const router = express.Router();
router.use(express.json({ limit: '10kb' }));
router.use(cookieParser());
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store'); // never cache anything auth-related
  next();
});

// Used so "user not found" takes as long as "wrong password" (timing attacks)
const DUMMY_HASH = bcrypt.hashSync('gaze-dummy-password', config.bcryptCost);

const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

/* ---------- helpers ---------- */

const cookieOpts = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict',
  path: config.cookiePath,
});

const setRefreshCookie = (res, token) =>
  res.cookie(config.cookieName, token, { ...cookieOpts(), maxAge: config.refreshTtlMs });

const clearRefreshCookie = (res) => res.clearCookie(config.cookieName, cookieOpts());

async function startSession(user, req, res) {
  // keep at most N devices per user: drop the least recently used
  const count = await Session.countDocuments({ userId: user._id });
  if (count >= config.maxSessionsPerUser) {
    const oldest = await Session.find({ userId: user._id })
      .sort({ lastUsedAt: 1 })
      .limit(count - config.maxSessionsPerUser + 1)
      .select('_id');
    await Session.deleteMany({ _id: { $in: oldest.map((s) => s._id) } });
  }

  const refreshToken = newRefreshToken();
  const session = await Session.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    lastUsedAt: new Date(),
    expiresAt: new Date(Date.now() + config.refreshTtlMs),
  });
  setRefreshCookie(res, refreshToken);
  return { accessToken: signAccess(user, session._id), session };
}

/* ---------- sign up / log in ---------- */

router.post(
  '/signup',
  limiters.signup,
  asyncH(async (req, res) => {
    const parsed = schemas.signup.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const { name, email, password } = parsed.data;

    const passwordHash = await bcrypt.hash(password, config.bcryptCost);
    let user;
    try {
      user = await User.create({ name, email, passwordHash });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
      }
      throw err;
    }
    const { accessToken } = await startSession(user, req, res);
    return res.status(201).json({ accessToken, user: user.toPublic() });
  })
);

router.post(
  '/login',
  limiters.login,
  asyncH(async (req, res) => {
    const parsed = schemas.login.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);
    const { email, password } = parsed.data;

    const invalid = () =>
      res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      await bcrypt.compare(password, DUMMY_HASH);
      return invalid();
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(429).json({
        error: 'Too many failed attempts. Try again in a few minutes.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLogins + 1;
      const update = { failedLogins: failed };
      if (failed >= config.maxFailedLogins) {
        update.failedLogins = 0;
        update.lockUntil = new Date(Date.now() + config.lockMs);
      }
      await User.updateOne({ _id: user._id }, update);
      return invalid();
    }

    await User.updateOne(
      { _id: user._id },
      { failedLogins: 0, lockUntil: null, lastLoginAt: new Date() }
    );
    const { accessToken } = await startSession(user, req, res);
    return res.json({ accessToken, user: user.toPublic() });
  })
);

/* ---------- Google sign-in ---------- */

router.post(
  '/google',
  limiters.login,
  asyncH(async (req, res) => {
    if (!googleClient) {
      return res.status(503).json({ error: 'Google sign-in is not configured', code: 'GOOGLE_OFF' });
    }
    const parsed = schemas.google.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: parsed.data.credential,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (_) {
      return res.status(401).json({ error: 'Google sign-in failed', code: 'GOOGLE_INVALID' });
    }
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google account email is not verified', code: 'GOOGLE_UNVERIFIED' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email }).select('+passwordHash');
      if (user) {
        // Account linking. If the existing account was never email-verified, someone
        // else may have pre-registered this email with THEIR password, so wipe it
        // and sign everyone out ("pre-hijacking" protection).
        if (!user.emailVerified) {
          user.passwordHash = undefined;
          await Session.deleteMany({ userId: user._id });
        }
        user.googleId = payload.sub;
        user.emailVerified = true;
        if (!user.name) user.name = String(payload.name || '').slice(0, 60);
        await user.save();
      } else {
        user = await User.create({
          email,
          name: String(payload.name || '').slice(0, 60),
          googleId: payload.sub,
          emailVerified: true,
        });
      }
    }

    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    const { accessToken } = await startSession(user, req, res);
    return res.json({ accessToken, user: user.toPublic() });
  })
);

/* ---------- refresh (rotation + reuse detection) ---------- */

router.post(
  '/refresh',
  limiters.refresh,
  requireSameOrigin,
  asyncH(async (req, res) => {
    const token = req.cookies[config.cookieName];
    if (!token) return res.status(401).json({ error: 'No session', code: 'NO_SESSION' });

    const hash = sha256(token);
    const now = new Date();

    const respondWithoutRotation = async (session) => {
      const user = await User.findById(session.userId);
      if (!user) {
        await session.deleteOne();
        clearRefreshCookie(res);
        return res.status(401).json({ error: 'Invalid session', code: 'INVALID_SESSION' });
      }
      return res.json({ accessToken: signAccess(user, session._id), user: user.toPublic() });
    };

    const session = await Session.findOne({ tokenHash: hash });
    if (session) {
      if (session.expiresAt < now) {
        await session.deleteOne();
        clearRefreshCookie(res);
        return res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
      }
      const user = await User.findById(session.userId);
      if (!user) {
        await session.deleteOne();
        clearRefreshCookie(res);
        return res.status(401).json({ error: 'Invalid session', code: 'INVALID_SESSION' });
      }

      const next = newRefreshToken();
      // Atomic: only rotate if nobody else rotated this session a moment ago
      const rotated = await Session.findOneAndUpdate(
        { _id: session._id, tokenHash: hash },
        {
          $set: {
            prevTokenHash: hash,
            tokenHash: sha256(next),
            rotatedAt: now,
            lastUsedAt: now,
            expiresAt: new Date(now.getTime() + config.refreshTtlMs),
          },
        },
        { returnDocument: 'after' }
      );
      if (!rotated) return respondWithoutRotation(session); // parallel tab won the race

      setRefreshCookie(res, next);
      return res.json({ accessToken: signAccess(user, session._id), user: user.toPublic() });
    }

    // Not the current token - was it the previous one?
    const reused = await Session.findOne({ prevTokenHash: hash });
    if (reused) {
      if (reused.rotatedAt && now - reused.rotatedAt <= config.refreshGraceMs) {
        return respondWithoutRotation(reused); // two tabs refreshing at once
      }
      // An old token was replayed later: assume it was stolen, kill the session
      await reused.deleteOne();
      clearRefreshCookie(res);
      return res.status(401).json({ error: 'Session revoked', code: 'TOKEN_REUSE' });
    }

    clearRefreshCookie(res);
    return res.status(401).json({ error: 'Invalid session', code: 'INVALID_SESSION' });
  })
);

/* ---------- logout / sessions / account ---------- */

router.post(
  '/logout',
  requireSameOrigin,
  asyncH(async (req, res) => {
    const token = req.cookies[config.cookieName];
    if (token) {
      const hash = sha256(token);
      await Session.deleteOne({ $or: [{ tokenHash: hash }, { prevTokenHash: hash }] });
    }
    clearRefreshCookie(res);
    return res.status(204).end();
  })
);

router.post(
  '/logout-all',
  requireSameOrigin,
  requireAuth,
  asyncH(async (req, res) => {
    await Session.deleteMany({ userId: req.auth.userId });
    clearRefreshCookie(res);
    return res.status(204).end();
  })
);

router.get(
  '/me',
  requireAuth,
  asyncH(async (req, res) => {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    return res.json({ user: user.toPublic() });
  })
);

router.post(
  '/profile',
  limiters.sensitive,
  requireAuth,
  asyncH(async (req, res) => {
    const parsed = schemas.profile.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);

    const set = {};
    if (parsed.data.nickname !== undefined) {
      set.nickname = parsed.data.nickname;
      set.nicknamePrompted = true;
    }
    if (parsed.data.nicknamePrompted === true) set.nicknamePrompted = true;

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: set },
      { returnDocument: 'after', runValidators: true }
    );
    if (!user) return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    return res.json({ user: user.toPublic() });
  })
);

router.get(
  '/sessions',
  requireAuth,
  asyncH(async (req, res) => {
    const sessions = await Session.find({ userId: req.auth.userId }).sort({ lastUsedAt: -1 });
    return res.json({
      sessions: sessions.map((s) => ({
        id: String(s._id),
        device: s.userAgent,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
        current: String(s._id) === req.auth.sessionId,
      })),
    });
  })
);

router.delete(
  '/sessions/:id',
  requireAuth,
  asyncH(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid session id', code: 'VALIDATION' });
    }
    await Session.deleteOne({ _id: req.params.id, userId: req.auth.userId });
    return res.status(204).end();
  })
);

router.post(
  '/change-password',
  limiters.sensitive,
  requireAuth,
  asyncH(async (req, res) => {
    const parsed = schemas.changePassword.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error);

    const user = await User.findById(req.auth.userId).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(400).json({
        error: 'This account has no password (it uses Google sign-in).',
        code: 'NO_PASSWORD',
      });
    }
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect', code: 'INVALID_CREDENTIALS' });

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, config.bcryptCost);
    await user.save();
    // sign out every OTHER device
    await Session.deleteMany({ userId: user._id, _id: { $ne: req.auth.sessionId } });
    return res.status(204).end();
  })
);

/* ---------- errors ---------- */

router.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON', code: 'BAD_JSON' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large', code: 'TOO_LARGE' });
  }
  console.error('[auth] error:', err && err.message);
  return res.status(500).json({ error: 'Something went wrong', code: 'SERVER_ERROR' });
});

module.exports = router;
