const express = require('express');
const router = express.Router();
const { getQuote } = require('../utils/getPrice');

// Get current price + change data — handles both NGX and US tickers.
// Uses the same NGN Market (NGX) + Finnhub (US) sources as the rest of
// the app, via getQuote() in utils/getPrice.js. No more Investo/Alpha
// Vantage — Investo's API no longer exists (confirmed dead endpoint).
router.get('/price/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const quote = await getQuote(ticker);
    res.json(quote);
  } catch (err) {
    console.error('[GET /stocks/price/:ticker] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;