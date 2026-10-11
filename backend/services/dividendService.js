const axios = require('axios');
const Dividend = require('../models/Dividend');

const BASE_URL = 'https://koboterminal.com/api/ngxdata/dividends';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SYMBOL_RE = /^[A-Z0-9]{2,20}$/;

const cleanDate = (v) => (typeof v === 'string' && DATE_RE.test(v) ? v : null);

function parseType(text = '') {
  if (/interim/i.test(text)) return 'interim';
  if (/final|full[- ]?year/i.test(text)) return 'final';
  return 'unknown';
}

function parsePeriod(text = '') {
  const m = text.match(/\b(H[12]|Q[1-4]|FY)\s*-?\s*(\d{4})\b/i);
  return m ? `${m[1].toUpperCase()} ${m[2]}` : null;
}

async function fetchHistory(symbol) {
  const key = process.env.KOBO_TERMINAL_API_KEY;
  if (!key) throw new Error('KOBO_TERMINAL_API_KEY is not configured');
  if (!SYMBOL_RE.test(symbol)) throw new Error(`Invalid symbol: ${symbol}`);

  const res = await axios.get(`${BASE_URL}/${encodeURIComponent(symbol)}`, {
    headers: { 'X-API-Key': key },
    timeout: 15000
  });

  if (!res.data || res.data.success !== true || !Array.isArray(res.data.history)) {
    throw new Error(`Unexpected response shape for ${symbol}`);
  }
  return res.data;
}


function normalize(rec, fallbackName) {
  if (!rec || !rec.row_hash || !rec.symbol) return null;
  const dps = Number(rec.dividend_per_share);
  const text = rec.raw_declared_text || '';
  return {
    rowHash: rec.row_hash,
    market: rec.exchange || 'NGX',
    symbol: String(rec.symbol).toUpperCase(),
    companyName: (() => {
      const own = (rec.company_name || '').trim();
      const usable = own && own.toUpperCase() !== String(rec.symbol).toUpperCase();
      return (usable ? own : (fallbackName || '').trim()) || own || null;
    })(),
    dividendPerShare: Number.isFinite(dps) ? dps : null,
    currency: rec.currency || 'NGN',
    dividendType: parseType(text),
    financialPeriod: parsePeriod(text),
    exDividendDate: cleanDate(rec.ex_dividend_date),
    recordDate: cleanDate(rec.record_date),
    paymentDate: cleanDate(rec.pay_date),
    rawDeclaredText: text || null,
    rawAmountText: rec.raw_amount_text ?? null,
    source: 'Kobo Terminal',
    providerSourceName: rec.source_name || null,
    providerUpdatedAt: rec.updated_at ? new Date(rec.updated_at) : null
  };
}

async function syncSymbol(symbol) {
  const data = await fetchHistory(symbol.toUpperCase());
  const now = new Date();
  const goodName = [data.company_name, ...data.history.map((r) => r.company_name)]
    .map((n) => (n || '').trim())
    .find((n) => n && n.toUpperCase() !== symbol.toUpperCase()) || null;

  const records = data.history.map((r) => normalize(r, goodName)).filter(Boolean);
  const skipped = data.history.length - records.length;

  if (records.length === 0) return { symbol, fetched: data.history.length, upserted: 0, modified: 0, skipped };

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
    symbol,
    fetched: data.history.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
    skipped
  };
}

module.exports = { fetchHistory, normalize, syncSymbol };