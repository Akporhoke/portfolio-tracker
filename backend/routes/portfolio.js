const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const getPrice = require('../utils/getPrice');
const calculateConfidenceLevel = require('../utils/confidenceCalculator'); // ← ADD THIS

// Helper: get or create a portfolio doc
async function getOrCreatePortfolio(userId) {
  let portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) {
    portfolio = new Portfolio({ userId, stocks: [], watchlist: [], sold: [], activity: [] });
    await portfolio.save();
  }
  return portfolio;
}

// GET full portfolio state, shaped for the frontend
router.get('/:userId', async (req, res) => {
  try {
    const portfolio = await getOrCreatePortfolio(req.params.userId);
    const { getExchangeRate } = require('../utils/exchangeRate'); // ← ADD THIS
    const exchangeRate = await getExchangeRate();

    // Refresh current prices for stocks + watchlist (live-on-GET)
    for (const stock of portfolio.stocks) {
      const price = await getPrice(stock.ticker);
      if (price !== null) {
        stock.currentPrice = price;
        // ← RECALCULATE confidence on each price update
        stock.confidenceLevel = calculateConfidenceLevel(stock, stock.market);
      }
    }
    for (const item of portfolio.watchlist) {
      const price = await getPrice(item.ticker);
      if (price !== null) {
        item.currentPrice = price;
        item.confidenceLevel = calculateConfidenceLevel(item, item.market);
      }
    }
    await portfolio.save();

    res.json({
      portfolio: { stocks: portfolio.stocks },
      watchlist: { stocks: portfolio.watchlist },
      sold: { stocks: portfolio.sold },
      activity: portfolio.activity,
      settings: portfolio.settings,
      exchangeRate: {
        usdToNgn: exchangeRate,
        ngnToUsd: 1 / exchangeRate,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('[GET /:userId] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add stock to portfolio
router.post('/:userId/add-stock', async (req, res) => {
  try {
    const { ticker, quantity, buyPrice, sector, notes, market } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    if (!market || !['NGX', 'US'].includes(market)) {
      return res.status(400).json({ error: 'Market must be NGX or US' });
    }

    const currentPrice = await getPrice(ticker);
    
    // ← USE REAL CONFIDENCE CALCULATION
    const newStock = {
      ticker: ticker.toUpperCase(),
      quantity,
      buyPrice,
      currentPrice: currentPrice ?? buyPrice,
      sector,
      notes,
      market,
      dateAdded: new Date()
    };
    newStock.confidenceLevel = calculateConfidenceLevel(newStock, market);

    portfolio.stocks.push(newStock);

    portfolio.activity.unshift({
      type: 'invested',
      title: `Bought ${ticker.toUpperCase()}`,
      description: `${quantity} shares @ ${market === 'US' ? '$' : '₦'}${buyPrice}`,
      date: new Date()
    });

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /add-stock] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add stock to watchlist
router.post('/:userId/add-watchlist', async (req, res) => {
  try {
    const { ticker, watchingDuration, sector, notes, market } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    if (!market || !['NGX', 'US'].includes(market)) {
      return res.status(400).json({ error: 'Market must be NGX or US' });
    }

    const currentPrice = await getPrice(ticker);
    
    // ← USE REAL CONFIDENCE CALCULATION
    const watchItem = {
      ticker: ticker.toUpperCase(),
      currentPrice,
      priceAtAdd: currentPrice,
      watchingDuration: watchingDuration || '1w',
      sector: sector || null,
      notes,
      market,
      dateAdded: new Date()
    };
    watchItem.confidenceLevel = calculateConfidenceLevel(watchItem, market);

    portfolio.watchlist.push(watchItem);

    portfolio.activity.unshift({
      type: 'watching',
      title: `Watching ${ticker.toUpperCase()}`,
      description: `Watching for ${watchingDuration || '1w'}`,
      date: new Date()
    });

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /add-watchlist] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove from watchlist
router.post('/:userId/remove-watchlist', async (req, res) => {
  try {
    const { ticker } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    const index = portfolio.watchlist.findIndex(
      w => w.ticker === ticker.toUpperCase()
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Stock not in watchlist' });
    }

    portfolio.watchlist.splice(index, 1);
    
    portfolio.activity.unshift({
      type: 'rejected',
      title: `${ticker.toUpperCase()} rejected`,
      description: 'Removed from watchlist',
      date: new Date()
    });

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /remove-watchlist] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Move from watchlist to portfolio
router.post('/:userId/watchlist-to-portfolio', async (req, res) => {
  try {
    const { ticker, quantity, buyPrice } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    const watchIndex = portfolio.watchlist.findIndex(
      w => w.ticker === ticker.toUpperCase()
    );

    if (watchIndex === -1) {
      return res.status(404).json({ message: 'Stock not in watchlist' });
    }

    const watchedStock = portfolio.watchlist[watchIndex];

    // Add to portfolio
    const newStock = {
      ticker: watchedStock.ticker,
      quantity,
      buyPrice,
      currentPrice: watchedStock.currentPrice,
      sector: watchedStock.sector || 'Other',
      notes: watchedStock.notes,
      market: watchedStock.market,
      dateAdded: new Date()
    };
    newStock.confidenceLevel = calculateConfidenceLevel(newStock, watchedStock.market); // ← CALC CONFIDENCE

    portfolio.stocks.push(newStock);

    // Remove from watchlist
    portfolio.watchlist.splice(watchIndex, 1);

    // Add activity
    portfolio.activity.unshift({
      type: 'invested',
      title: `Bought ${ticker.toUpperCase()}`,
      description: `${quantity} shares @ ${watchedStock.market === 'US' ? '$' : '₦'}${buyPrice} (from watchlist)`,
      date: new Date()
    });

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /watchlist-to-portfolio] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sell a stock (fully or partially)
router.post('/:userId/sell-stock', async (req, res) => {
  try {
    const { ticker, quantity } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    const index = portfolio.stocks.findIndex(
      s => s.ticker === ticker.toUpperCase()
    );

    if (index === -1) {
      return res.status(404).json({ message: 'Stock not found in portfolio' });
    }

    const stock = portfolio.stocks[index];
    const sellPrice = await getPrice(stock.ticker) ?? stock.currentPrice ?? stock.buyPrice;

    // Determine quantity to sell
    let sellQty = parseInt(quantity);
    if (!sellQty || sellQty <= 0 || sellQty > stock.quantity) {
      sellQty = stock.quantity;
    }

    portfolio.sold.push({
      ticker: stock.ticker,
      quantity: sellQty,
      buyPrice: stock.buyPrice,
      sellPrice,
      sector: stock.sector,
      market: stock.market,
      dateSold: new Date()
    });

    if (sellQty >= stock.quantity) {
      portfolio.stocks.splice(index, 1);
    } else {
      stock.quantity -= sellQty;
    }

    portfolio.activity.unshift({
      type: 'sold',
      title: `Sold ${stock.ticker}`,
      description: `${sellQty} shares @ ${stock.market === 'US' ? '$' : '₦'}${sellPrice}`,
      date: new Date()
    });

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /sell-stock] Error:', err);
    res.status(500).json({ error: err.message });
  }
});



// Update settings (goal amount, currency preference, etc.)
router.post('/:userId/settings', async (req, res) => {
  try {
    const { goalAmount, displayCurrency } = req.body;
    const portfolio = await getOrCreatePortfolio(req.params.userId);

    if (goalAmount) portfolio.settings.goalAmount = goalAmount;
    if (displayCurrency && ['NGN', 'USD'].includes(displayCurrency)) {
      portfolio.settings.displayCurrency = displayCurrency;
    }

    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    console.error('[POST /settings] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get historical prices for chart
router.get('/:userId/chart/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = req.query.days || 30;
    
    const { getPriceHistory } = require('../utils/getPrice');
    const history = await getPriceHistory(ticker, parseInt(days));
    
    res.json({
      ticker,
      days: parseInt(days),
      data: history
    });
  } catch (err) {
    console.error('[GET /chart/:ticker] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;