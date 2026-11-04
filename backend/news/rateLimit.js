'use strict';

const MAX_TRACKED_KEYS = 10000; // hard cap so an attacker cannot grow memory

// Fixed-window limiter keyed by client IP. In-memory means each server
// instance counts separately; if you ever run several instances, swap this for
// a shared limiter (for example Redis-backed) without touching the routes.
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.reset <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || 'unknown';

    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      if (!entry && hits.size >= MAX_TRACKED_KEYS) {
        // Map keeps insertion order, so the first key is the oldest.
        hits.delete(hits.keys().next().value);
      }
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.reset - now) / 1000))));
      return res.status(429).json({ error: 'rate_limited' });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
