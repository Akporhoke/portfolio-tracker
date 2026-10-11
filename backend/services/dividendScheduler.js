const cron = require('node-cron');
const { syncSymbol } = require('./dividendService');

const SYMBOLS = (process.env.DIVIDEND_SYMBOLS ||
  'ZENITHBANK,GTCO,ACCESSCORP,UBA,FIDELITYBK')
  .split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

const MAX_PER_RUN = 80;     // stay well inside the 100/day limit
const GAP_MS = 7000;        // ~8 requests/minute, under the 10/minute limit
const CRON_EXPR = process.env.DIVIDEND_CRON || '0 6 * * *';

let running = false;
const status = { lastRunAt: null, lastResults: [] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Dividend = require('../models/Dividend');

const STALE_MS = 20 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 30 * 1000;

async function runIfStale() {
  const latest = await Dividend.findOne()
    .sort({ lastCheckedAt: -1 })
    .select('lastCheckedAt')
    .lean();

  const last = latest && latest.lastCheckedAt
    ? new Date(latest.lastCheckedAt).getTime()
    : 0;

  if (Date.now() - last > STALE_MS) {
    console.log('[Dividends] Data is stale, running catch-up sync');
    await runDividendSync();
  }
}

async function runDividendSync() {
  if (running) {
    console.log('[Dividends] Previous run still in progress, skipping');
    return null;
  }
  if (!process.env.KOBO_TERMINAL_API_KEY) {
    console.error('[Dividends] KOBO_TERMINAL_API_KEY is not set, skipping run');
    return null;
  }

  running = true;
  const results = [];

  try {
    for (const symbol of SYMBOLS.slice(0, MAX_PER_RUN)) {
      try {
        results.push({ ok: true, ...(await syncSymbol(symbol)) });
      } catch (err) {
        const code = err.response && err.response.status;
        results.push({ ok: false, symbol, error: code ? `HTTP ${code}` : err.message });
        console.error(`[Dividends] ${symbol} failed:`, code || err.message);
        if (code === 401 || code === 403 || code === 429) {
          console.error('[Dividends] Stopping run: auth or rate-limit problem');
          break;
        }
      }
      await sleep(GAP_MS);
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

function startDividendScheduler() {
  cron.schedule(CRON_EXPR, () => {
    runDividendSync().catch((e) => console.error('[Dividends] Run crashed:', e.message));
  }, { timezone: 'Africa/Lagos' });
    setTimeout(() => {
    runIfStale().catch((e) => console.error('[Dividends] Catch-up failed:', e.message));
  }, STARTUP_DELAY_MS);

  console.log(`✓ Dividend scheduler started (${CRON_EXPR}, ${SYMBOLS.length} symbols)`);
}

module.exports = { startDividendScheduler, runDividendSync, status };