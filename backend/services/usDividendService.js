const axios = require('axios');
const crypto = require('crypto');
const Dividend = require('../models/Dividend');
const Stock = require('../models/Stock');

const BASE_URL = 'https://api.twelvedata.com/dividends';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

async function fetchUsHistory(symbol, range) {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error('TWELVE_DATA_API_KEY is not configured');
  if (!SYMBOL_RE.test(symbol)) throw new Error(`Invalid symbol: ${symbol}`);

  let res;
  try {
    res = await axios.get(BASE_URL, {
      params: { symbol, range, apikey: key },
      timeout: 15000
    });
  } catch (err) {
    // Twelve Data explains the problem in the response body, so surface it
    const status = err.response && err.response.status;
    const body = err.response && err.response.data;
    const detail = body && (body.message || body.error);
    if (detail) err.message = `${err.message} (${String(detail).slice(0, 160)})`;
    // 403 here means this symbol or endpoint is not covered by the plan
    if (status === 403) err.planRestricted = true;
    throw err;
  }

  const data = res.data;

  // Twelve Data can also report errors inside a normal 200 response
  if (data && data.status === 'error') {
    const code = Number(data.code) || 500;
    const err = new Error(data.message || 'Twelve Data error');
    err.response = { status: code };
    err.notFound = code === 404 || /not found/i.test(String(data.message || ''));
    err.planRestricted = code === 403;
    throw err;
  }
  if (!data || !Array.isArray(data.dividends)) {
    throw new Error(`Unexpected response shape for ${symbol}`);
  }
  return data;
}

function normalizeUs(rec, symbol, companyName, currency) {
  const exDividendDate =
    typeof rec.ex_date === 'string' && DATE_RE.test(rec.ex_date) ? rec.ex_date : null;
  const amount = Number(rec.amount);
  if (!exDividendDate || !Number.isFinite(amount)) return null;

  // The provider gives no ID, so identity = market + symbol + ex-date + amount
  const rowHash = crypto.createHash('sha1')
    .update(`US|${symbol}|${exDividendDate}|${amount}`).digest('hex');

  return {
    rowHash,
    market: 'US',
    symbol,
    companyName: companyName || null,
    dividendPerShare: amount,
    currency: currency || 'USD',
    dividendType: 'unknown',
    financialPeriod: null,
    exDividendDate,
    recordDate: null,
    paymentDate: null,
    rawDeclaredText: null,
    rawAmountText: String(rec.amount),
    source: 'Twelve Data',
    providerSourceName: 'Twelve Data',
    providerUpdatedAt: null
  };
}

async function syncUsSymbol(symbol, range = '1y') {
  const sym = symbol.toUpperCase();
  const data = await fetchUsHistory(sym, range);
  const now = new Date();

  const stock = await Stock.findOne({ ticker: sym, market: 'US' }).select('name').lean();
  const name = (data.meta && data.meta.name) || (stock && stock.name) || null;
  const currency = data.meta && data.meta.currency;

  const records = data.dividends.map((r) => normalizeUs(r, sym, name, currency)).filter(Boolean);
  const skipped = data.dividends.length - records.length;

  if (records.length === 0) {
    return { symbol: sym, fetched: data.dividends.length, upserted: 0, modified: 0, skipped };
  }

  const result = await Dividend.bulkWrite(
    records.map((r) => ({
      updateOne: {
        filter: { rowHash: r.rowHash },
        update: { $set: { ...r, lastCheckedAt: now } },
        upsert: true
      }
    }))
  );

  return {
    symbol: sym,
    fetched: data.dividends.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
    skipped
  };
}

module.exports = { fetchUsHistory, normalizeUs, syncUsSymbol };