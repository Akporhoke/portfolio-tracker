const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: String,

  stocks: [
    {
      ticker: String,
      quantity: Number,
      buyPrice: Number,
      currentPrice: Number,
      sector: String,
      notes: String,
      market: { type: String, enum: ['NGX', 'US'], required: true }, // ← NEW
      confidenceLevel: { type: Number, default: 0, min: 0, max: 100 }, // ← NEW (0-100)
      dateAdded: { type: Date, default: Date.now }
    }
  ],

  watchlist: [
    {
      ticker: String,
      currentPrice: Number,
      priceAtAdd: Number,
      watchingDuration: { type: String, enum: ['2d', '1w', '2w'], default: '1w' },
      sector: { type: String, default: null },
      notes: String,
      market: { type: String, enum: ['NGX', 'US'], required: true }, // ← NEW
      confidenceLevel: { type: Number, default: 0, min: 0, max: 100 }, // ← NEW
      dateAdded: { type: Date, default: Date.now }
    }
  ],

  sold: [
    {
      ticker: String,
      quantity: Number,
      buyPrice: Number,
      sellPrice: Number,
      sector: String,
      market: { type: String, enum: ['NGX', 'US'], required: true }, // ← NEW
      dateSold: { type: Date, default: Date.now }
    }
  ],

  activity: [
    {
      type: { type: String, enum: ['invested', 'sold', 'rejected', 'watching'] },
      title: String,
      description: String,
      date: { type: Date, default: Date.now }
    }
  ],

  settings: {
    goalAmount: { type: Number, default: 1000000 },
    displayCurrency: { type: String, default: 'NGN', enum: ['NGN', 'USD'] }
},

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);