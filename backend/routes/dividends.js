const express = require('express');
const Dividend = require('../models/Dividend');
const { requireRole } = require('../gaze-auth/src');
const { refreshOne, getDividendStatus } = require('../services/dividendScheduler');

const router = express.Router();
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,20}$/;
const MARKETS = ['NGX', 'US'];

const marketOf = (value) => String(value || 'NGX').trim().toUpperCase();

// GET /api/dividends?month=2026-10
router.get('/', async (req, res) => {
  const { month } = req.query;
  if (!MONTH_RE.test(month || '')) {
    return res.status(400).json({ success: false, error: 'month must be YYYY-MM' });
  }
  try {
    const prefix = new RegExp(`^${month}`);
    const docs = await Dividend.find({
      $or: [{ exDividendDate: prefix }, { recordDate: prefix }, { paymentDate: prefix }]
    }).lean();

    const events = [];
    for (const d of docs) {
      const base = {
        market: d.market || 'NGX',
        symbol: d.symbol,
        companyName: d.companyName,
        dividendPerShare: d.dividendPerShare,
        currency: d.currency,
        dividendType: d.dividendType,
        financialPeriod: d.financialPeriod,
        rawDeclaredText: d.rawDeclaredText,
        exDividendDate: d.exDividendDate,
        recordDate: d.recordDate,
        paymentDate: d.paymentDate
      };
      if (d.exDividendDate?.startsWith(month)) events.push({ ...base, eventType: 'ex-dividend', date: d.exDividendDate });
      if (d.recordDate?.startsWith(month) && d.recordDate !== d.exDividendDate)
        events.push({ ...base, eventType: 'record', date: d.recordDate });
      if (d.paymentDate?.startsWith(month)) events.push({ ...base, eventType: 'payment', date: d.paymentDate });
    }
    events.sort((a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol));

    res.json({ success: true, month, events });
  } catch (err) {
    console.error('Dividends month query failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load dividends' });
  }
});

// GET /api/dividends/admin/status  (admin only)
router.get('/admin/status', requireRole('admin'), async (req, res) => {
  try {
    res.json({ success: true, ...(await getDividendStatus()) });
  } catch (err) {
    console.error('Dividend status failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load status' });
  }
});

// POST /api/dividends/refresh/:symbol?market=US  (admin only; uses provider quota)
router.post('/refresh/:symbol', requireRole('admin'), async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const market = marketOf(req.query.market);
  if (!SYMBOL_RE.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
  if (!MARKETS.includes(market)) return res.status(400).json({ success: false, error: 'Market must be NGX or US' });
  try {
    const result = await refreshOne(symbol, market);
    if (!result.ok) {
      return res.status(502).json({ success: false, error: 'Refresh failed; stored data unchanged', detail: result.error });
    }
    res.json({ success: true, result });
  } catch (err) {
    if (err.budget) return res.status(429).json({ success: false, error: err.message });
    console.error('Dividend refresh failed:', symbol, err.message);
    res.status(500).json({ success: false, error: 'Refresh failed' });
  }
});

// GET /api/dividends/:symbol?market=US  (history for one company)
router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const market = marketOf(req.query.market);
  if (!SYMBOL_RE.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
  if (!MARKETS.includes(market)) return res.status(400).json({ success: false, error: 'Market must be NGX or US' });
  try {
    const records = await Dividend.find({ symbol, market }).sort({ exDividendDate: -1 }).lean();
    res.json({ success: true, symbol, market, records });
  } catch (err) {
    console.error('Dividend history failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not load dividends' });
  }
});

module.exports = router;