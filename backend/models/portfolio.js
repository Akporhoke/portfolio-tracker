const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: String,
  stocks: [
    {
      ticker: String,
      quantity: Number,
      buyPrice: Number,
      dateAdded: {
        type: Date,
        default: Date.now
      },
      sector: String,
      currentPrice: Number,
      notes: String
    }
  ],
  goal: {
    targetAmount: Number,
    targetAllocation: {} // e.g., { "Tech": 40, "Finance": 30 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);