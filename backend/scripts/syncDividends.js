require('dotenv').config();
const mongoose = require('mongoose');
const { syncSymbol } = require('../services/dividendService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const symbol = process.argv[2] || 'ZENITHBANK';
  console.log(await syncSymbol(symbol));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.response?.status, e.message); process.exit(1); });