const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

// Get user's portfolio
router.get('/:userId', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.params.userId });
    
    if (!portfolio) {
      return res.json({ stocks: [], goal: {} });
    }
    
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add stock to portfolio
router.post('/:userId/add-stock', async (req, res) => {
  try {
    const { ticker, quantity, buyPrice, sector, notes } = req.body;
    
    let portfolio = await Portfolio.findOne({ userId: req.params.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.params.userId, stocks: [] });
    }
    
    portfolio.stocks.push({
      ticker,
      quantity,
      buyPrice,
      sector,
      notes
    });
    
    await portfolio.save();
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set portfolio goal
router.post('/:userId/set-goal', async (req, res) => {
  try {
    const { targetAmount, targetAllocation } = req.body;
    
    let portfolio = await Portfolio.findOne({ userId: req.params.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.params.userId });
    }
    
    portfolio.goal = { targetAmount, targetAllocation };
    await portfolio.save();
    
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;