require('dotenv').config();
const mongoose = require('mongoose');
const Portfolio = require('./models/Portfolio');

function dedupeByTicker(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.ticker)) return false;
    seen.add(item.ticker);
    return true;
  });
}

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(async () => {
    const p = await Portfolio.findOne({ userId: 'user-1' });

    const beforeStocks = p.stocks.length;
    const beforeWatch = p.watchlist.length;

    p.stocks = dedupeByTicker(p.stocks);
    p.watchlist = dedupeByTicker(p.watchlist);

    await p.save();

    console.log(`Stocks: ${beforeStocks} → ${p.stocks.length}`);
    console.log(`Watchlist: ${beforeWatch} → ${p.watchlist.length}`);
    process.exit();
  });