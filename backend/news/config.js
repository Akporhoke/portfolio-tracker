'use strict';

// Read an integer from the environment and clamp it to a safe range.
// Bad or missing values fall back to the default, so a typo in a dashboard
// can never produce a 0ms refresh loop or a 10-year retention.
function intEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// Feeds are fixed in code, never taken from a request. That removes the
// biggest SSRF risk (a user making the server fetch an address they chose).
// "domain" is the only host family the fetcher may contact for this source.
const SOURCES = [
  {
    id: 'gnews-ngx',
    name: 'Google News',
    domain: 'news.google.com',
    url: 'https://news.google.com/rss/search?q=NGX+Nigerian+Exchange+stocks&hl=en-NG&gl=NG&ceid=NG:en',
    splitPublisher: true, // Google titles end with " - Publisher"
  },
  {
    id: 'gnews-dividends',
    name: 'Google News',
    domain: 'news.google.com',
    url: 'https://news.google.com/rss/search?q=Nigerian+stocks+dividend+earnings&hl=en-NG&gl=NG&ceid=NG:en',
    splitPublisher: true,
  },
  {
    id: 'nairametrics',
    name: 'Nairametrics',
    domain: 'nairametrics.com',
    url: 'https://nairametrics.com/feed/',
    splitPublisher: false,
  },
];

module.exports = Object.freeze({
  sources: SOURCES,
  refreshIntervalMs: intEnv('NEWS_REFRESH_MINUTES', 15, 5, 120) * 60 * 1000,
  retentionMs: intEnv('NEWS_RETENTION_DAYS', 14, 1, 60) * 24 * 60 * 60 * 1000,
  fetchTimeoutMs: 8000,        // one overall deadline per feed, redirects included
  maxFeedBytes: 2 * 1024 * 1024, // refuse feeds larger than 2 MB
  maxItemsPerSource: 50,       // newest 50 per feed is plenty and bounds storage
  rateLimit: {
    windowMs: 60 * 1000,
    max: intEnv('NEWS_RATE_LIMIT_PER_MIN', 60, 5, 1000),
  },
  userAgent: 'GazeNewsBot/1.0',
});
