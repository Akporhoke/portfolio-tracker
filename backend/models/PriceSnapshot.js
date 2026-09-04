const mongoose = require('mongoose');

// Stores one row per (ticker, date) — captured live, ourselves, since
// NGN Market's free tier only gives current price, not history.
// Every time getPrice() successfully fetches a real NGX price, we upsert
// today's row here. Over time this becomes a real (if slowly-growing)
// price history table, at no cost.
const priceSnapshotSchema = new mongoose.Schema({
  ticker: { type: String, required: true, uppercase: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD, so one row per day
  price: { type: Number, required: true },
  source: { type: String, default: 'ngnmarket' },
  createdAt: { type: Date, default: Date.now }
});

// One document per ticker+date — re-saving the same day just updates the price.
priceSnapshotSchema.index({ ticker: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PriceSnapshot', priceSnapshotSchema);