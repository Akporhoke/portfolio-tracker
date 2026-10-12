require('dotenv').config();
const mongoose = require('mongoose');
const { refreshOne } = require('../services/dividendScheduler');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const symbol = (process.argv[2] || '').toUpperCase();
  const market = (process.argv[3] || 'NGX').toUpperCase();
  if (!symbol) throw new Error('Usage: node scripts/refreshDividend.js SYMBOL [NGX|US]');
  console.log(await refreshOne(symbol, market));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });