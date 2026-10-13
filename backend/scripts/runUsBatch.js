require('dotenv').config();
const mongoose = require('mongoose');
const DividendSyncState = require('../models/DividendSyncState');
const Stock = require('../models/Stock');
const { refreshOne } = require('../services/dividendScheduler');

const max = parseInt(process.argv[2], 10) || 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const pending = await DividendSyncState.find({ market: 'US', status: 'pending' }).lean();
  const symbols = pending.map((p) => p.symbol);
  const stocks = await Stock.find({ market: 'US', ticker: { $in: symbols } })
    .sort({ marketCap: -1, ticker: 1 }).select('ticker').lean();

  // Largest first, then any pending symbols that have no directory record
  const ordered = [...new Set([...stocks.map((s) => s.ticker), ...symbols])].slice(0, max);
  console.log(`${pending.length} US symbols pending, running up to ${ordered.length}`);

  for (const symbol of ordered) {
    try {
      const r = await refreshOne(symbol, 'US');
      console.log(r.ok
        ? `ok     ${symbol}: ${r.fetched} records`
        : `failed ${symbol}: ${r.error}`);
      if (r.fatal) { console.log('Stopping: limit reached or key problem'); break; }
    } catch (e) {
      console.log(e.budget ? 'Stopping: daily budget reached' : `error ${symbol}: ${e.message}`);
      if (e.budget) break;
    }
    await sleep(2000);
  }

  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });