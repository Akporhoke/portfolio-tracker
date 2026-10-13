const cron = require('node-cron');
const Stock = require('../models/Stock');
const Dividend = require('../models/Dividend');
const DividendSyncState = require('../models/DividendSyncState');
const DividendRequestLog = require('../models/DividendRequestLog');
const { syncSymbol } = require('./dividendService');
const { syncUsSymbol } = require('./usDividendService');

const CRON_EXPR = process.env.DIVIDEND_CRON || '0 6 * * *';
const STALE_MS = 20 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 30 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const posInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return n > 0 ? n : fallback;
};

// Alpha Vantage's free key allows 25 requests a day, so keep US well under that.
const US_CAP = posInt(process.env.US_DIVIDEND_DAILY_CAP, 15);
const US_SYMBOL_LIMIT = posInt(process.env.US_DIVIDEND_SYMBOL_LIMIT, 60);

const MARKETS = {
  NGX: {
    provider: 'kobo',
    envKey: 'KOBO_TERMINAL_API_KEY',
    scheduledCap: 80,
    hardCap: 95,
    gapMs: 7000,
    // Kobo: any of these means the key or quota is the problem, so stop the run
    fatalCodes: [401, 403, 429],
    sync: (state) => syncSymbol(state.providerSymbol || state.symbol)
  },
  US: {
    provider: 'alphavantage',
    envKey: 'ALPHA_VANTAGE_KEY',
    scheduledCap: US_CAP,
    hardCap: US_CAP + 3,
    gapMs: posInt(process.env.US_DIVIDEND_GAP_MS, 2000),
    // Alpha Vantage rate-limit notices are mapped to 429 by the service
    fatalCodes: [401, 429],
    sync: (state) => syncUsSymbol(state.providerSymbol || state.symbol)
  }
};

let running = false;
const status = { lastRunAt: null, lastResults: [] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

async function quotaUsed(provider) {
  return DividendRequestLog.countDocuments({
    at: { $gte: new Date(Date.now() - DAY) },
    // Older Kobo log rows have no provider field, so treat "not another provider" as Kobo
    provider: provider === 'kobo' ? { $nin: ['twelve', 'alphavantage'] } : provider
  });
}

function nextCheck(outcome, { upcoming = false, failCount = 0 } = {}) {
  if (outcome === 'ok') return new Date(Date.now() + (upcoming ? DAY : 7 * DAY));
  if (outcome === 'empty') return new Date(Date.now() + 14 * DAY);
  if (outcome === 'not_found') return new Date(Date.now() + 30 * DAY);
  return new Date(Date.now() + Math.min(6 * HOUR * 2 ** Math.max(failCount - 1, 0), 48 * HOUR));
}

/* ---------- Which symbols belong to a market ---------- */

async function getSymbols(market) {
  let stocks;
  if (market === 'NGX') {
    stocks = await Stock.find({ market: 'NGX', active: true }).select('ticker').lean();
  } else {
    // Interim: biggest US names from the directory.
    // Portfolio and watchlist tickers should come first once we wire the Portfolio model.
    stocks = await Stock.find({ market: 'US', active: true })
      .sort({ marketCap: -1, ticker: 1 })
      .limit(US_SYMBOL_LIMIT)
      .select('ticker')
      .lean();
  }
  return [...new Set(stocks.map((s) => String(s.ticker).toUpperCase()))];
}

/* ---------- Which symbols are due ---------- */

async function buildQueue(market, limit) {
  const tickers = await getSymbols(market);
  if (!tickers.length) return { queue: [], upcoming: new Set() };

  await DividendSyncState.bulkWrite(
    tickers.map((symbol) => ({
      updateOne: {
        filter: { market, symbol },
        update: { $setOnInsert: { status: 'pending', failCount: 0, nextCheckAt: new Date(0) } },
        upsert: true
      }
    })),
    { ordered: false }
  );

  const from = isoDay(-3);
  const to = isoDay(30);
  const nearDocs = await Dividend.find({
    market,
    $or: [
      { exDividendDate: { $gte: from, $lte: to } },
      { paymentDate: { $gte: from, $lte: to } }
    ]
  }).select('symbol').lean();
  const upcoming = new Set(nearDocs.map((d) => d.symbol));

  const due = await DividendSyncState.find({
    market,
    symbol: { $in: tickers },
    nextCheckAt: { $lte: new Date() }
  }).lean();

  const rank = (s) => (s.status === 'pending' ? 0 : upcoming.has(s.symbol) ? 1 : 2);
  due.sort((a, b) => rank(a) - rank(b) || new Date(a.nextCheckAt) - new Date(b.nextCheckAt));

  return { queue: due.slice(0, limit), upcoming };
}

/* ---------- One tracked request ---------- */

async function checkOne(state, upcoming, cfg) {
  const now = new Date();
  // Logged BEFORE the request, so a crash still counts against the budget
  await DividendRequestLog.create({ symbol: state.symbol, provider: cfg.provider });

  try {
    const r = await cfg.sync(state);
    const outcome = r.fetched > 0 ? 'ok' : 'empty';
    await DividendSyncState.updateOne({ _id: state._id }, { $set: {
      status: outcome, lastAttemptAt: now, lastSuccessAt: now, failCount: 0,
      lastRecordCount: r.fetched, lastError: null,
      nextCheckAt: nextCheck(outcome, { upcoming })
    } });
    return { ok: true, ...r, symbol: state.symbol, market: state.market };

  } catch (err) {
    const code = err.response && err.response.status;
    const fatal = cfg.fatalCodes.includes(code);
    const message = [code && `HTTP ${code}`, err.message].filter(Boolean).join(': ');

    if (fatal) {
      // Key, plan or quota problem, not this symbol's fault: do not penalise it, just stop the run
      await DividendSyncState.updateOne({ _id: state._id },
        { $set: { lastAttemptAt: now, lastError: message } });
      return { ok: false, fatal: true, symbol: state.symbol, market: state.market, code, error: message };
    }

    // Unknown to the provider, or not covered by the plan: park it for 30 days
    const unsupported = code === 404 || err.notFound === true || err.planRestricted === true;
    const outcome = unsupported ? 'not_found' : 'error';
    const failCount = outcome === 'error' ? (state.failCount || 0) + 1 : 0;
    await DividendSyncState.updateOne({ _id: state._id }, { $set: {
      status: outcome, lastAttemptAt: now, failCount, lastError: message,
      nextCheckAt: nextCheck(outcome, { failCount })
    } });
    return { ok: false, symbol: state.symbol, market: state.market, code, error: message };
  }
}

/* ---------- One market's scheduled run ---------- */

async function runMarket(market, results) {
  const cfg = MARKETS[market];

  if (!process.env[cfg.envKey]) {
    console.error(`[Dividends] ${cfg.envKey} is not set, skipping ${market}`);
    return;
  }

  const used = await quotaUsed(cfg.provider);
  const budget = cfg.scheduledCap - used;
  if (budget <= 0) {
    console.log(`[Dividends] ${market}: budget used up (${used} requests in 24h), skipping`);
    return;
  }

  const { queue, upcoming } = await buildQueue(market, budget);
  console.log(`[Dividends] ${market}: ${queue.length} symbols due (budget ${budget}, used ${used})`);

  for (const state of queue) {
    const r = await checkOne(state, upcoming.has(state.symbol), cfg);
    results.push(r);
    if (!r.ok) console.error(`[Dividends] ${market} ${state.symbol} failed:`, r.error);
    if (r.fatal) {
      console.error(`[Dividends] ${market}: stopping, auth or rate-limit problem`);
      break;
    }
    await sleep(cfg.gapMs);
  }
}

async function runDividendSync() {
  if (running) {
    console.log('[Dividends] Previous run still in progress, skipping');
    return null;
  }

  running = true;
  const results = [];

  try {
    for (const market of Object.keys(MARKETS)) {
      try {
        await runMarket(market, results);
      } catch (err) {
        console.error(`[Dividends] ${market} run crashed:`, err.message);
      }
    }
  } finally {
    running = false;
    status.lastRunAt = new Date();
    status.lastResults = results;
    const okCount = results.filter((r) => r.ok).length;
    console.log(`[Dividends] Run finished: ${okCount}/${results.length} symbols updated`);
  }

  return results;
}

/* ---------- Admin manual refresh ---------- */

async function refreshOne(symbol, market = 'NGX') {
  const cfg = MARKETS[market];
  if (!cfg) throw new Error('Unknown market');

  const used = await quotaUsed(cfg.provider);
  if (used >= cfg.hardCap) {
    const err = new Error('Daily request budget exhausted');
    err.budget = true;
    throw err;
  }
  const state = await DividendSyncState.findOneAndUpdate(
    { market, symbol },
    { $setOnInsert: { status: 'pending', failCount: 0, nextCheckAt: new Date(0) } },
    { upsert: true, returnDocument: 'after' }
  ).lean();
  return checkOne(state, false, cfg);
}

/* ---------- Catch-up and cron ---------- */

async function runIfStale() {
  const latest = await DividendRequestLog.findOne().sort({ at: -1 }).lean();
  const last = latest ? new Date(latest.at).getTime() : 0;
  if (Date.now() - last > STALE_MS) {
    console.log('[Dividends] No recent run, starting catch-up sync');
    await runDividendSync();
  }
}

function startDividendScheduler() {
  cron.schedule(CRON_EXPR, () => {
    runDividendSync().catch((e) => console.error('[Dividends] Run crashed:', e.message));
  }, { timezone: 'Africa/Lagos' });

  setTimeout(() => {
    runIfStale().catch((e) => console.error('[Dividends] Catch-up failed:', e.message));
  }, STARTUP_DELAY_MS);

  console.log(`✓ Dividend scheduler started (${CRON_EXPR}, NGX via Kobo, US via Alpha Vantage cap ${US_CAP}/day)`);
}

/* ---------- Admin status ---------- */

async function getDividendStatus() {
  const markets = {};
  for (const [market, cfg] of Object.entries(MARKETS)) {
    const [used, grouped, dueNow] = await Promise.all([
      quotaUsed(cfg.provider),
      DividendSyncState.aggregate([
        { $match: { market } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      DividendSyncState.countDocuments({ market, nextCheckAt: { $lte: new Date() } })
    ]);
    markets[market] = {
      provider: cfg.provider,
      requestsLast24h: used,
      scheduledCeiling: cfg.scheduledCap,
      hardCeiling: cfg.hardCap,
      dueNow,
      bySyncStatus: Object.fromEntries(grouped.map((g) => [g._id, g.count]))
    };
  }
  return {
    markets,
    lastRunAt: status.lastRunAt,
    lastRun: status.lastResults.map((r) => ({
      market: r.market, symbol: r.symbol, ok: r.ok, error: r.error || null
    }))
  };
}

module.exports = { startDividendScheduler, runDividendSync, refreshOne, getDividendStatus, status };