const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get current price - handles both US and Nigerian stocks
router.get('/price/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    // Try Investo for Nigerian stocks first (covers NSE + US stocks)
    try {
      const response = await axios.get(
        `https://investo.ng/api/v1/prices/${ticker}?interval=latest`,
        {
          headers: { Authorization: `Bearer ${process.env.INVESTO_API_KEY}` }
        }
      );
      
      if (response.data.ok) {
        return res.json({
          ticker,
          price: response.data.data.close,
          change: response.data.data.close - response.data.data.open,
          timestamp: response.data.data.date,
          source: 'investo'
        });
      }
    } catch (err) {
      // If not found in Investo, fall back to Alpha Vantage for US stocks
      if (err.response?.status === 404) {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
        );
        
        const data = response.data['Global Quote'];
        
        if (!data['05. price']) {
          return res.status(404).json({ error: 'Stock not found' });
        }
        
        return res.json({
          ticker,
          price: parseFloat(data['05. price']),
          change: data['09. change'],
          changePercent: data['10. change percent'],
          timestamp: data['07. latest trading day'],
          source: 'alphavantage'
        });
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;