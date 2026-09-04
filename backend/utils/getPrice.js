const axios = require('axios');
const PriceSnapshot = require('../models/PriceSnapshot');

// ---------------------------------------------------------------------------
// NGN Market API — confirmed against real docs at docs.ngnmarket.com
//   Base URL: https://api.ngnmarket.com/v1
//   Auth:     Authorization: Bearer ngm_live_YOUR_KEY
//   Free tier (3,000 calls/mo): GET /companies?search=TICKER  → live price
//   Paid only (Hobby+, ₦15,000/mo): GET /companies/:symbol/chart → real history
//
// Since paid history isn't in budget right now, we build our own history:
// every successful live-price fetch for an NGX ticker gets saved as a daily
// snapshot in MongoDB (see recordSnapshot below + models/PriceSnapshot.js).
// getPriceHistory() reads from those real snapshots first, and only pads
// with mock data for days we don't have real data for yet.
// ---------------------------------------------------------------------------
const NGNMARKET_BASE_URL = 'https://api.ngnmarket.com/v1';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function recordSnapshot(ticker, price) {
  try {
    await PriceSnapshot.findOneAndUpdate(
      { ticker: ticker.toUpperCase(), date: todayStr() },
      { price, source: 'ngnmarket' },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    // Never let history-recording break a price lookup
    console.log(`[recordSnapshot] Failed to save snapshot for ${ticker}: ${err.message}`);
  }
}

async function getPrice(ticker) {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const ngnMarketKey = process.env.NGNMARKET_API_KEY;

    // NGX stocks list
    const ngxStocks = ['GTCO', 'NESTLE', 'ZENITHBANK', 'STANBIC', 'SEPLAT'];
    const isNGX = ngxStocks.includes(ticker.toUpperCase());

    // Try NGN Market (free tier) for NGX stocks
    if (isNGX && ngnMarketKey) {
      try {
        const response = await axios.get(`${NGNMARKET_BASE_URL}/companies`, {
          params: { search: ticker, limit: 10 },
          headers: { Authorization: `Bearer ${ngnMarketKey}` },
          timeout: 5000
        });

        const results = response.data?.data?.data || [];
        const match = results.find(
          (c) => c.symbol.toUpperCase() === ticker.toUpperCase()
        );

        if (match && match.price !== undefined && match.price !== null) {
          console.log(`✓ NGN Market price for ${ticker}: ${match.price}`);
          // Fire-and-forget: build our own history one day at a time
          recordSnapshot(ticker, match.price);
          return match.price;
        }
        console.log(`[getPrice] NGN Market returned no exact match for ${ticker}`);
      } catch (err) {
        console.log(`[getPrice] NGN Market failed for ${ticker}: ${err.message}`);
        if (err.response) {
          console.log(`[getPrice] NGN Market response body:`, err.response.data);
        }
      }
    }

    // Try Finnhub for US/other stocks
    if (finnhubKey) {
      try {
        const response = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`,
          { timeout: 5000 }
        );
        if (response.data && response.data.c) {
          console.log(`✓ Finnhub price for ${ticker}: ${response.data.c}`);
          return response.data.c;
        }
      } catch (err) {
        console.log(`[getPrice] Finnhub failed for ${ticker}: ${err.message}`);
      }
    }

    // Fallback to mock
    return getMockPrice(ticker);
  } catch (err) {
    console.error('[getPrice] Error:', err.message);
    return getMockPrice(ticker);
  }
}

function getMockPrice(ticker) {
  const mockPrices = {
    GTCO: 35.5,
    AAPL: 180.0,
    MSFT: 380.0,
    GOOGL: 140.0,
    NESTLE: 800.0,
    SEPLAT: 450.0,
    STANBIC: 50.0,
    ZENITHBANK: 32.0
  };
  const price = mockPrices[ticker.toUpperCase()];
  console.log(`[getPrice] Mock price for ${ticker}: ${price || 100}`);
  return price || 100;
}

async function getPriceHistory(ticker, days = 30) {
  const ngxStocks = ['GTCO', 'NESTLE', 'ZENITHBANK', 'STANBIC', 'SEPLAT'];
  const isNGX = ngxStocks.includes(ticker.toUpperCase());
  const finnhubKey = process.env.FINNHUB_API_KEY;

  // NGX: use our own recorded snapshots (real data, built day by day)
  if (isNGX) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const snapshots = await PriceSnapshot.find({
        ticker: ticker.toUpperCase(),
        date: { $gte: cutoffStr }
      }).sort({ date: 1 });

      if (snapshots.length > 0) {
        console.log(`✓ ${snapshots.length} real recorded day(s) for ${ticker}`);
      }

      // Not enough real history yet (e.g. brand new ticker, or app just
      // started recording) — pad the front with mock data so the chart
      // still has something to show, but keep real data real.
      const realDates = new Set(snapshots.map((s) => s.date));
      const daysNeeded = days - snapshots.length;

      let mockPadding = [];
      if (daysNeeded > 0) {
        const mockHistory = getMockHistory(ticker, daysNeeded);
        // Don't let mock padding overlap dates we actually have real data for
        mockPadding = mockHistory.filter((h) => !realDates.has(h.date));
      }

      const combined = [
        ...mockPadding.map((h) => ({ ...h, source: 'mock' })),
        ...snapshots.map((s) => ({
          date: s.date,
          open: s.price,
          high: s.price,
          low: s.price,
          close: s.price,
          volume: null,
          source: 'real'
        }))
      ];

      return combined;
    } catch (err) {
      console.log(`[getPriceHistory] Snapshot lookup failed for ${ticker}: ${err.message}`);
      return getMockHistory(ticker, days).map((h) => ({ ...h, source: 'mock' }));
    }
  }

  // Try Finnhub for US/other stocks
  if (finnhubKey) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = now - days * 24 * 60 * 60;

      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${now}&token=${finnhubKey}`,
        { timeout: 5000 }
      );

      if (response.data && response.data.c && response.data.c.length > 0) {
        console.log(`✓ Finnhub history for ${ticker}: ${response.data.c.length} days`);
        return response.data.c.map((close, index) => ({
          date: new Date(response.data.t[index] * 1000).toISOString().split('T')[0],
          open: response.data.o[index],
          high: response.data.h[index],
          low: response.data.l[index],
          close,
          volume: response.data.v[index],
          source: 'real'
        }));
      }
    } catch (err) {
      console.log(`[getPriceHistory] Finnhub failed for ${ticker}: ${err.message}`);
    }
  }

  return getMockHistory(ticker, days).map((h) => ({ ...h, source: 'mock' }));
}

function getMockHistory(ticker, days = 30) {
  const history = [];
  let price = getMockPrice(ticker);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * price * 0.05;
    price = Math.max(price + variation, 1);

    history.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat((price - 1).toFixed(2)),
      high: parseFloat((price + 2).toFixed(2)),
      low: parseFloat((price - 2).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000)
    });
  }

  console.log(`[getPriceHistory] Mock ${history.length} days for ${ticker}`);
  return history;
}

// ---------------------------------------------------------------------------
// Full quote (price + change + %) — used by routes/stocks.js for the
// stock-detail modal. Reuses the same NGN Market / Finnhub sources as
// getPrice(), just returns richer data instead of a bare number.
// ---------------------------------------------------------------------------
async function getQuote(ticker) {
  const ngxStocks = ['GTCO', 'NESTLE', 'ZENITHBANK', 'STANBIC', 'SEPLAT'];
  const isNGX = ngxStocks.includes(ticker.toUpperCase());
  const ngnMarketKey = process.env.NGNMARKET_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (isNGX && ngnMarketKey) {
    try {
      const response = await axios.get(`${NGNMARKET_BASE_URL}/companies`, {
        params: { search: ticker, limit: 10 },
        headers: { Authorization: `Bearer ${ngnMarketKey}` },
        timeout: 5000
      });

      const results = response.data?.data?.data || [];
      const match = results.find(
        (c) => c.symbol.toUpperCase() === ticker.toUpperCase()
      );

      if (match && match.price !== undefined && match.price !== null) {
        recordSnapshot(ticker, match.price);
        return {
          ticker: ticker.toUpperCase(),
          price: match.price,
          change: match.price_change ?? null,
          changePercent: match.price_change_percent ?? null,
          timestamp: match.last_updated || new Date().toISOString(),
          source: 'ngnmarket'
        };
      }
    } catch (err) {
      console.log(`[getQuote] NGN Market failed for ${ticker}: ${err.message}`);
    }
  }

  if (finnhubKey) {
    try {
      const response = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`,
        { timeout: 5000 }
      );
      if (response.data && response.data.c) {
        return {
          ticker: ticker.toUpperCase(),
          price: response.data.c,
          change: response.data.d ?? null,
          changePercent: response.data.dp ?? null,
          timestamp: new Date().toISOString(),
          source: 'finnhub'
        };
      }
    } catch (err) {
      console.log(`[getQuote] Finnhub failed for ${ticker}: ${err.message}`);
    }
  }

  // Fallback: mock, but still shaped like a real quote
  const price = getMockPrice(ticker);
  return {
    ticker: ticker.toUpperCase(),
    price,
    change: 0,
    changePercent: 0,
    timestamp: new Date().toISOString(),
    source: 'mock'
  };
}

// Backward-compatible export: `getPrice` stays directly callable
// (const getPrice = require('./utils/getPrice')) while also exposing
// getPriceHistory as a property, and both as named exports for anyone
// who prefers destructuring going forward.
module.exports = getPrice;
module.exports.getPrice = getPrice;
module.exports.getPriceHistory = getPriceHistory;
module.exports.getQuote = getQuote;