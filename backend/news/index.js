'use strict';

// ARCHITECTURE (ports and adapters)
//
//   feeds -> fetcher (guarded) -> parser -> sanitize -> store -> service -> routes -> browser
//
// - Requests only ever READ from the store. Fetching happens in the background,
//   so the API stays fast and keeps working when a feed is down.
// - The store is a small contract (see stores/memoryStore.js). Moving off
//   MongoDB means writing one new file, not touching anything else.
// - Nothing here depends on a specific host: configuration comes from
//   environment variables and nothing is written to the local disk.
//
// Environment variables (all optional):
//   NEWS_STORE              "mongo" or "memory" (default: mongo when mongoose is passed)
//   NEWS_REFRESH_MINUTES    5-120, default 15
//   NEWS_RETENTION_DAYS     1-60, default 14
//   NEWS_RATE_LIMIT_PER_MIN 5-1000, default 60

const config = require('./config');
const { TICKER_ALIASES, createMatcher } = require('./tickers');
const { MemoryStore } = require('./stores/memoryStore');
const { createMongoStore } = require('./stores/mongoStore');
const { NewsService } = require('./service');
const { createRateLimiter } = require('./rateLimit');
const { createRouter } = require('./routes');

function createNews({ mongoose, storeType = process.env.NEWS_STORE, logger = console } = {}) {
  const type = storeType || (mongoose ? 'mongo' : 'memory');

  let store;
  if (type === 'mongo') {
    if (!mongoose) throw new Error('NEWS_STORE=mongo needs the mongoose instance');
    store = createMongoStore(mongoose);
  } else if (type === 'memory') {
    store = new MemoryStore();
  } else {
    throw new Error(`Unknown NEWS_STORE "${type}"`);
  }

  const service = new NewsService({
    store,
    config,
    matchTickers: createMatcher(TICKER_ALIASES),
    logger,
  });

  const router = createRouter({
    service,
    rateLimit: createRateLimiter(config.rateLimit),
  });

  return { service, router, store };
}

module.exports = { createNews };
