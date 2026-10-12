require('dotenv').config();
const mongoose = require('mongoose');
const DividendSyncState = require('../models/DividendSyncState');
const Stock = require('../models/Stock');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const states = await DividendSyncState.find({ status: 'empty' }).select('symbol').lean();
  const stocks = await Stock.find({ ticker: { $in: states.map((s) => s.symbol) }, market: 'NGX' })
    .select('ticker name').lean();
  const names = Object.fromEntries(stocks.map((s) => [s.ticker, s.name]));
  states.forEach((s) => console.log(`${s.symbol}  -  ${names[s.symbol] || '(no name found)'}`));
  console.log(`\n${states.length} symbols returned no dividends`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });