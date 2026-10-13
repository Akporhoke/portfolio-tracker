const axios = require('axios');
const crypto = require('crypto');
const Dividend = require('../models/Dividend');
const Stock = require('../models/Stock');

const BASE_URL = 'https://www.alphavantage.co/query';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

// Alpha Vantage sends the string "None" for missing dates, so only accept real dates
const cleanDate = (v) => (typeof v === 'string' && DATE_RE.test(v) ? v : null);

async function fetchUsHistory(symbol) {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY is not configured');
  if (!SYMBOL_RE.test(symbol)) throw new Error(`Invalid symbol: ${symbol}`);

  const res = await axios.get(BASE_URL, {
    params: { function: 'DIVIDENDS', symbol, apikey: key },
    timeout: 20000
  });
  const data = res.data;

  // Alpha Vantage reports rate limits and plan notices inside a normal 200 response
  if (data && (data.Note || data.Information)) {
    const err = new Error(String(data.Note || data.Information).slice(0, 200));
    err.response = { status: 429 };
    throw err;
  }
  if (data && data['Error Message']) {
    const err = new Error(String(data['Error Message']).slice(0, 200));
    err.notFound = true;
    throw err;
  }
  // An empty object means no dividend data for this symbol
  if (data && typeof data === 'object' && Object.keys(data).length === 0) {
    return { data: [] };
  }
  if (!data || !Array.isArray(data.data)) {
    throw new Error(`Unexpected response shape for ${symbol}`);
  }
  return data;
}

function normalizeUs(rec, symbol, companyName) {
  const exDividendDate = cleanDate(rec.ex_dividend_date);
  const amount = Number(rec.amount);
  if (!exDividendDate || !Number.isFinite(amount)) return null;

  // Identity = market + symbol + ex-date + amount, the same formula as before,
  // so records already stored for AAPL are updated in place, not duplicated
  const rowHash = crypto.createHash('sha1')
    .update(`US|${symbol}|${exDividendDate}|${amount}`).digest('hex');

  const declared = cleanDate(rec.declaration_date);

  return {
    rowHash,
    market: 'US',
    symbol,
    companyName: companyName || null,
    dividendPerShare: amount,
    currency: 'USD',
    dividendType: 'unknown',
    financialPeriod: null,
    exDividendDate,
    recordDate: cleanDate(rec.record_date),
    paymentDate: cleanDate(rec.payment_date),
    // The Dividend model has no declaration-date field, so keep it as a note
    rawDeclaredText: declared ? `Declared ${declared}` : null,
    rawAmountText: String(rec.amount),
    source: 'Alpha Vantage',
    providerSourceName: 'Alpha Vantage',
    providerUpdatedAt: null
  };
}

// Gaze stores class shares as BRK/B; the provider usually expects BRK-B
const toProviderSymbol = (s) => String(s).toUpperCase().replace(/\//g, '-');

async function syncUsSymbol(symbol) {
  const sym = symbol.toUpperCase();
  const data = await fetchUsHistory(toProviderSymbol(sym));
  const now = new Date();

  const stock = await Stock.findOne({ ticker: sym, market: 'US' }).select('name').lean();
  const name = (stock && stock.name) || null;

  const records = data.data.map((r) => normalizeUs(r, sym, name)).filter(Boolean);
  const skipped = data.data.length - records.length;

  if (records.length === 0) {
    return { symbol: sym, fetched: data.data.length, upserted: 0, modified: 0, skipped };
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
    fetched: data.data.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
    skipped
  };
}

module.exports = { fetchUsHistory, normalizeUs, syncUsSymbol };