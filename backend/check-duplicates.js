require('dotenv').config();
const mongoose = require('mongoose');
const Portfolio = require('./models/Portfolio');

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(async () => {
    const p = await Portfolio.findOne({ userId: 'user-1' });
    console.log('Stocks:', p.stocks.map(s => s.ticker));
    console.log('Watchlist:', p.watchlist.map(w => w.ticker));
    process.exit();
  });