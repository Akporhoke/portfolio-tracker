'use strict';

const express = require('express');

const TICKER_RE = /^[A-Z0-9]{1,15}$/;
const CURSOR_RE = /^(\d{10,14})-([a-f0-9]{24})$/;

// Returns a clean query object, or null if anything is off. Whitelisting what
// is allowed (instead of trying to block bad input) is what stops injection:
// Express parses ?tickers[$ne]=x into an object, and a type check rejects it
// before it can ever reach a database query.
function parseQuery(q) {
  const out = { tickers: [], limit: 30, before: null };

  if (q.tickers !== undefined) {
    if (typeof q.tickers !== 'string' || q.tickers.length > 400) return null;
    const list = q.tickers
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (list.length > 20 || !list.every((t) => TICKER_RE.test(t))) return null;
    out.tickers = [...new Set(list)];
  }

  if (q.limit !== undefined) {
    if (typeof q.limit !== 'string' || !/^\d{1,3}$/.test(q.limit)) return null;
    out.limit = Math.min(Math.max(parseInt(q.limit, 10), 1), 50);
  }

  if (q.before !== undefined) {
    const m = typeof q.before === 'string' ? CURSOR_RE.exec(q.before) : null;
    if (!m) return null;
    out.before = { publishedAt: Number(m[1]), id: m[2] };
  }

  return out;
}

function createRouter({ service, rateLimit }) {
  const router = express.Router();
  router.use(rateLimit);

  // Minimal public status for uptime monitors. Per-source detail stays
  // available only in code via service.getHealth() for your admin view.
  router.get('/health', (req, res) => {
    const h = service.getHealth();
    res.set('Cache-Control', 'no-store');
    res.json({ status: h.stale ? 'stale' : 'ok', updatedAt: h.lastSuccessAt });
  });

  router.get('/', async (req, res) => {
    const query = parseQuery(req.query);
    if (!query) return res.status(400).json({ error: 'bad_request' });

    try {
      const data = await service.getNews(query);
      res.set({
        // Public headlines, safe to cache briefly in browsers and any CDN.
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.json(data);
    } catch (err) {
      // Log the reason server-side; never send internals to the client.
      console.error('[news] request failed:', err.message);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

module.exports = { createRouter, parseQuery };
