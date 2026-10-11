const express = require('express');
const Dividend = require('../models/Dividend');
const { syncSymbol } = require('../services/dividendService');
const { requireRole } = require('../gaze-auth/src');

const router = express.Router();
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const SYMBOL_RE = /^[A-Za-z0-9]{2,20}$/;

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

// POST /api/dividends/refresh/:symbol  (admin only; uses provider quota)
router.post('/refresh/:symbol', requireRole('admin'), async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!SYMBOL_RE.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
  try {
    res.json({ success: true, result: await syncSymbol(symbol) });
  } catch (err) {
    console.error('Dividend refresh failed:', symbol, err.response?.status, err.message);
    res.status(502).json({ success: false, error: 'Refresh failed; stored data unchanged' });
  }
});

// GET /api/dividends/:symbol  (history for one company)
router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  if (!SYMBOL_RE.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
  try {
    const records = await Dividend.find({ symbol }).sort({ exDividendDate: -1 }).lean();
    res.json({ success: true, symbol, records });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not load dividends' });
  }
});

module.exports = router;