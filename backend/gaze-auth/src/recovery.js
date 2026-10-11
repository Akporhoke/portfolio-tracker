'use strict';

const crypto = require('crypto');
const config = require('./config');
const { sha256 } = require('./tokens');
const User = require('./models/User');
const EmailToken = require('./models/EmailToken');
const email = require('./email'); // used as email.sendEmail(...) so it can be swapped in tests
const templates = require('./emailTemplates');

const newToken = () => crypto.randomBytes(32).toString('base64url');

const greetingName = (user) => user.nickname || user.name || '';

// Run something after the HTTP response has been sent; failures are logged, never thrown.
function queue(task) {
  Promise.resolve()
    .then(task)
    .catch((err) => console.error('[recovery] background task failed:', err.message));
}

// Is this account allowed another email of this kind right now?
async function checkSendAllowance(user, type) {
  const now = Date.now();
  const last = await EmailToken.findOne({ userId: user._id, type }).sort({ createdAt: -1 });
  if (last) {
    const waitMs = config.emailCooldownMs - (now - new Date(last.createdAt).getTime());
    if (waitMs > 0) return { ok: false, retryAfterSec: Math.ceil(waitMs / 1000) };
  }
  const recent = await EmailToken.countDocuments({
    userId: user._id,
    type,
    createdAt: { $gt: new Date(now - 60 * 60 * 1000) }
  });
  if (recent >= config.emailMaxPerHour) return { ok: false, retryAfterSec: 3600 };
  return { ok: true };
}

async function issueToken(user, type, ttlMs) {
  const now = new Date();
  // older unused links for this account stop working
  await EmailToken.updateMany({ userId: user._id, type, usedAt: null }, { $set: { usedAt: now } });
  const token = newToken();
  const expiresAt = new Date(now.getTime() + ttlMs);
  await EmailToken.create({
    userId: user._id,
    type,
    tokenHash: sha256(token),
    expiresAt,
    purgeAt: new Date(expiresAt.getTime() + 60 * 60 * 1000)
  });
  return token;
}

// Single use + not expired, atomically. Returns the token document, or null.
function consumeToken(rawToken, type) {
  const now = new Date();
  return EmailToken.findOneAndUpdate(
    { tokenHash: sha256(String(rawToken)), type, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { returnDocument: 'before' }
  );
}

async function sendVerificationEmail(user, { skipAllowanceCheck = false } = {}) {
  if (user.emailVerified) return false;
  if (!skipAllowanceCheck && !(await checkSendAllowance(user, 'verify')).ok) return false;
  const token = await issueToken(user, 'verify', config.verifyTtlMs);
  const link = `${config.appUrl}/verify-email.html#token=${encodeURIComponent(token)}`;
  return email.sendEmail({ to: user.email, ...templates.verifyEmail({ name: greetingName(user), link }) });
}

async function sendResetEmail(user) {
  if (!(await checkSendAllowance(user, 'reset')).ok) return false;
  const token = await issueToken(user, 'reset', config.resetTtlMs);
  const link = `${config.appUrl}/reset-password.html#token=${encodeURIComponent(token)}`;
  return email.sendEmail({ to: user.email, ...templates.resetEmail({ name: greetingName(user), link }) });
}

function sendPasswordChangedEmail(user) {
  return email.sendEmail({
    to: user.email,
    ...templates.passwordChanged({ name: greetingName(user), appUrl: config.appUrl })
  });
}

module.exports = {
  queue,
  checkSendAllowance,
  consumeToken,
  sendVerificationEmail,
  sendResetEmail,
  sendPasswordChangedEmail
};
