const express = require('express');
const router = express.Router();
const { getFxRates } = require('../utils/exchangeRate');

router.get('/', async (req, res) => {
  try {
    res.json(await getFxRates());
  } catch (e) {
    res.status(502).json({ error: 'FX rates unavailable' });
  }
});

module.exports = router;