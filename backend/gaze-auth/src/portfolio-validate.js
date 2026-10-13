'use strict';

// Put this file in:  backend/gaze-auth/src/portfolio-validate.js
//
// Use in server.js (right after the guard):
//   const portfolioGuard = require('./gaze-auth/src/portfolio-guard');
//   const portfolioValidate = require('./gaze-auth/src/portfolio-validate');
//   app.use('/api/portfolio', portfolioGuard, portfolioValidate, portfolioRoutes);
//
// Checks everything the app sends to the portfolio routes BEFORE your route code runs:
//   - tickers can only be letters, numbers, "." and "-"  (stops script injection through a ticker)
//   - market must be NGX or US, quantities/prices must be real positive numbers
//   - text fields have a length limit and no control characters
//   - private responses are marked "no-store" so no browser or proxy keeps a copy
// Your routes/portfolio.js is not edited. Bad requests get a 400 with a readable message.

const { z } = require('zod');

const TICKER_RX = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

const ticker = z
  .string({ required_error: 'Ticker is required', invalid_type_error: 'Ticker must be text' })
  .trim()
  .toUpperCase()
  .regex(TICKER_RX, 'Ticker can only use letters, numbers, "." and "-" (max 12)');

const market = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
  z.enum(['NGX', 'US'], {
    errorMap: () => ({ message: 'Market must be NGX or US' }),
  })
);

const amount = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .finite(`${label} must be a number`)
    .positive(`${label} must be greater than 0`)
    .max(1e9, `${label} is too large`);

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const text = (label, max) =>
  z.preprocess(
    (v) => (v === null || v === undefined ? '' : v),
    z
      .string({ invalid_type_error: `${label} must be text` })
      .max(max, `${label} is too long (max ${max} characters)`)
      .transform((v) => v.replace(CONTROL_CHARS, '').trim())
  );

// Sector names come from your stock directory, so no fixed list: just safe characters.
const sector = z.preprocess(
  (v) => (v === null || v === undefined ? '' : v),
  z
    .string({ invalid_type_error: 'Sector must be text' })
    .trim()
    .max(60, 'Sector is too long')
    .regex(/^[\p{L}\p{N} &,.'/()-]*$/u, 'Sector has characters that are not allowed')
);

const duration = z
  .enum(['2d', '1w', '2w'], { errorMap: () => ({ message: 'Watching duration must be 2d, 1w or 2w' }) })
  .optional();

const optionalMarket = market.optional();

/* ---------- one entry per route the app uses ---------- */

const ROUTES = [
  // public market data (no login needed): checked here, still not sent through the guard
  {
    method: 'GET',
    rx: /^\/stocks\/history\/([^/]+)\/?$/,
    public: true,
    params: ['ticker'],
    query: z.object({
      market: optionalMarket,
      days: z.coerce.number().int().min(1, 'days must be at least 1').max(365, 'days can be at most 365').optional(),
    }).partial(),
  },
  { method: 'GET', rx: /^\/([^/]+)\/?$/, params: [] },
  {
    method: 'GET',
    rx: /^\/([^/]+)\/confidence-history\/([^/]+)\/?$/,
    params: [null, 'ticker'],
    query: z.object({ market: optionalMarket }).partial(),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/stocks\/?$/,
    body: z.object({
      ticker,
      market,
      quantity: amount('Quantity'),
      buyPrice: amount('Buy price'),
      sector,
      notes: text('Notes', 500),
    }),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/add-watchlist\/?$/,
    body: z.object({
      ticker,
      market,
      sector,
      notes: text('Notes', 500),
      watchingDuration: duration,
    }),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/watchlist\/([^/]+)\/add-to-portfolio\/?$/,
    params: [null, 'ticker'],
    body: z.object({ quantity: amount('Quantity'), buyPrice: amount('Buy price') }),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/remove-watchlist\/?$/,
    body: z.object({ ticker }),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/sell-stock\/?$/,
    body: z.object({ ticker, market, quantity: amount('Quantity') }),
  },
  {
    method: 'POST',
    rx: /^\/([^/]+)\/edit-stock\/?$/,
    body: z.object({ ticker, market, quantity: amount('Quantity'), buyPrice: amount('Buy price') }),
  },
];

function reject(res, issues) {
  const details = issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  return res.status(400).json({
    // the app shows error.message || error.error, so put the readable text first
    error: details[0] ? details[0].message : 'Invalid input',
    code: 'VALIDATION',
    details,
  });
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch (_) { return null; }
}

function portfolioValidate(req, res, next) {
  const route = ROUTES.find((r) => r.method === req.method && r.rx.test(req.path));
  if (!route) return next(); // a route this file doesn't know: let your router decide

  if (!route.public) res.set('Cache-Control', 'private, no-store');

  const match = route.rx.exec(req.path);
  const issues = [];

  // values taken from the URL path, e.g. /:userId/confidence-history/:ticker
  (route.params || []).forEach((name, i) => {
    if (!name) return;
    const raw = safeDecode(match[i + 1]);
    const parsed = raw === null ? null : ticker.safeParse(raw);
    if (!parsed || !parsed.success) {
      issues.push({ path: [name], message: parsed ? parsed.error.issues[0].message : 'Bad ticker in the address' });
    }
  });

  let cleanBody;
  if (route.body) {
    const parsed = route.body.safeParse(req.body && typeof req.body === 'object' ? req.body : {});
    if (parsed.success) cleanBody = parsed.data;
    else issues.push(...parsed.error.issues);
  }

  if (route.query) {
    const parsed = route.query.safeParse(req.query || {});
    if (!parsed.success) issues.push(...parsed.error.issues);
  }

  if (issues.length) return reject(res, issues);
  if (cleanBody) req.body = cleanBody; // only the known, cleaned fields reach your routes
  return next();
}

module.exports = portfolioValidate;
